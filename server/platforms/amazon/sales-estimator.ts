/**
 * Amazon Sales Estimator
 *
 * 核心算法模块：基于 BSR、评价数等指标估算亚马逊产品销量
 *
 * 算法原理：
 * 1. BSR 转销量：使用指数衰减模型，不同类目有不同系数
 * 2. 评价数推算：基于评价转化率（1-5%）和产品年龄
 * 3. 综合估算：多指标加权融合，提供置信度评分
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface SalesEstimate {
  dailySales: number;
  confidence: number;
}

export interface ComprehensiveSalesEstimate {
  dailySales: number;
  monthlySales: number;
  confidence: number;
  method: string;
  breakdown: {
    bsrEstimate?: SalesEstimate;
    reviewEstimate?: {
      totalSales: number;
      monthlySales: number;
      confidence: number;
    };
    weights?: {
      bsr: number;
      review: number;
      other: number;
    };
  };
}

export interface ReviewSalesEstimate {
  totalSales: number;
  monthlySales: number;
  confidence: number;
}

// ============================================================================
// 类目配置数据
// ============================================================================

/**
 * BSR 转销量系数配置
 *
 * 基于行业研究和实际数据：
 * - a: 基础销量系数
 * - b: 衰减指数（控制曲线陡峭程度）
 * - 公式：dailySales = a * (BSR ^ b)
 */
interface CategoryConfig {
  a: number;      // 基础系数
  b: number;      // 衰减指数
  reviewRate: number;  // 评价转化率（默认值）
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  // 电子产品类目
  'Electronics': {
    a: 50000,
    b: -0.85,
    reviewRate: 0.025  // 2.5%
  },

  // 家居厨房类目
  'Home & Kitchen': {
    a: 45000,
    b: -0.82,
    reviewRate: 0.03   // 3%
  },

  // 图书类目（评价率较高）
  'Books': {
    a: 30000,
    b: -0.78,
    reviewRate: 0.04   // 4%
  },

  // 玩具游戏类目
  'Toys & Games': {
    a: 40000,
    b: -0.80,
    reviewRate: 0.028  // 2.8%
  },

  // 运动户外类目
  'Sports & Outdoors': {
    a: 42000,
    b: -0.81,
    reviewRate: 0.027  // 2.7%
  },

  // 服装鞋包类目
  'Clothing, Shoes & Jewelry': {
    a: 38000,
    b: -0.79,
    reviewRate: 0.022  // 2.2%
  },

  // 美妆个护类目
  'Beauty & Personal Care': {
    a: 43000,
    b: -0.83,
    reviewRate: 0.032  // 3.2%
  },

  // 健康家用类目
  'Health & Household': {
    a: 41000,
    b: -0.81,
    reviewRate: 0.029  // 2.9%
  },

  // 工具家装类目
  'Tools & Home Improvement': {
    a: 39000,
    b: -0.80,
    reviewRate: 0.026  // 2.6%
  },

  // 默认配置
  'default': {
    a: 40000,
    b: -0.80,
    reviewRate: 0.025  // 2.5%
  }
};

// ============================================================================
// 核心算法实现
// ============================================================================

/**
 * BSR 转销量估算
 *
 * 算法原理：
 * - 使用幂律分布（Power Law）模型
 * - 公式：dailySales = a * (BSR ^ b)
 * - 不同类目有不同的 a 和 b 系数
 *
 * 置信度计算：
 * - BSR < 1000: 高置信度 (0.8-0.9)
 * - BSR 1000-10000: 中等置信度 (0.6-0.8)
 * - BSR > 10000: 低置信度 (0.4-0.6)
 *
 * @param bsr - Best Sellers Rank
 * @param category - 产品类目
 * @param marketplace - 市场站点（预留，未来支持不同站点）
 */
export function estimateSalesFromBSR(
  bsr: number,
  category: string = 'default',
  marketplace: string = 'US'
): SalesEstimate {
  // 参数验证
  if (bsr <= 0) {
    return { dailySales: 0, confidence: 0 };
  }

  // 获取类目配置
  const config = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS['default'];

  // 计算日销量：dailySales = a * (BSR ^ b)
  const dailySales = Math.max(1, Math.round(config.a * Math.pow(bsr, config.b)));

  // 计算置信度
  let confidence: number;
  if (bsr < 100) {
    confidence = 0.9;  // Top 100: 非常高的置信度
  } else if (bsr < 1000) {
    confidence = 0.85; // Top 1000: 高置信度
  } else if (bsr < 5000) {
    confidence = 0.75; // Top 5000: 较高置信度
  } else if (bsr < 10000) {
    confidence = 0.65; // Top 10000: 中等置信度
  } else if (bsr < 50000) {
    confidence = 0.55; // Top 50000: 中低置信度
  } else {
    confidence = 0.45; // 50000+: 低置信度
  }

  return {
    dailySales,
    confidence
  };
}

/**
 * 评价数推算销量
 *
 * 算法原理：
 * - 评价转化率通常在 1-5% 之间
 * - 公式：totalSales = reviewCount / reviewRate
 * - 考虑产品上架时间计算月均销量
 *
 * 置信度计算：
 * - 评价数越多，置信度越高
 * - 产品年龄越长，置信度越高（数据更稳定）
 *
 * @param reviewCount - 评价总数
 * @param productAge - 产品上架日期
 * @param category - 产品类目（影响评价转化率）
 */
export function estimateSalesFromReviews(
  reviewCount: number,
  productAge: Date,
  category: string = 'default'
): ReviewSalesEstimate {
  // 参数验证
  if (reviewCount <= 0) {
    return { totalSales: 0, monthlySales: 0, confidence: 0 };
  }

  // 获取类目配置
  const config = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS['default'];
  const reviewRate = config.reviewRate;

  // 计算总销量
  const totalSales = Math.round(reviewCount / reviewRate);

  // 计算产品年龄（月）
  const now = new Date();
  const ageInMonths = Math.max(1,
    (now.getTime() - productAge.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // 计算月均销量
  const monthlySales = Math.round(totalSales / ageInMonths);

  // 计算置信度
  let confidence: number;

  // 基于评价数的置信度
  let reviewConfidence: number;
  if (reviewCount < 10) {
    reviewConfidence = 0.3;
  } else if (reviewCount < 50) {
    reviewConfidence = 0.5;
  } else if (reviewCount < 100) {
    reviewConfidence = 0.6;
  } else if (reviewCount < 500) {
    reviewConfidence = 0.7;
  } else if (reviewCount < 1000) {
    reviewConfidence = 0.8;
  } else {
    reviewConfidence = 0.9;
  }

  // 基于产品年龄的置信度
  let ageConfidence: number;
  if (ageInMonths < 1) {
    ageConfidence = 0.4;  // 新品数据不稳定
  } else if (ageInMonths < 3) {
    ageConfidence = 0.6;
  } else if (ageInMonths < 6) {
    ageConfidence = 0.7;
  } else if (ageInMonths < 12) {
    ageConfidence = 0.8;
  } else {
    ageConfidence = 0.9;  // 老品数据稳定
  }

  // 综合置信度（加权平均）
  confidence = reviewConfidence * 0.6 + ageConfidence * 0.4;

  return {
    totalSales,
    monthlySales,
    confidence
  };
}

/**
 * 综合估算销量
 *
 * 算法原理：
 * - 融合多个指标，加权计算最终销量
 * - BSR 权重 60%（最可靠的指标）
 * - 评价法权重 30%（辅助验证）
 * - 其他信号权重 10%（价格、库存等）
 *
 * 置信度计算：
 * - 多指标互相验证时，置信度提升
 * - 指标冲突时，置信度降低
 *
 * @param params - 综合参数
 */
export function estimateSalesComprehensive(params: {
  bsr?: number;
  category?: string;
  reviewCount?: number;
  reviewGrowthRate?: number;
  price?: number;
  availability?: string;
  productAge?: Date;
  marketplace?: string;
}): ComprehensiveSalesEstimate {
  const {
    bsr,
    category = 'default',
    reviewCount,
    reviewGrowthRate,
    price,
    availability,
    productAge,
    marketplace = 'US'
  } = params;

  let dailySales = 0;
  let totalConfidence = 0;
  let method = '';
  const breakdown: any = {};
  const weights = { bsr: 0, review: 0, other: 0 };

  // ========== 方法 1: BSR 估算 ==========
  if (bsr && bsr > 0) {
    const bsrEstimate = estimateSalesFromBSR(bsr, category, marketplace);
    breakdown.bsrEstimate = bsrEstimate;

    dailySales += bsrEstimate.dailySales * 0.6;
    totalConfidence += bsrEstimate.confidence * 0.6;
    weights.bsr = 0.6;
    method = 'BSR';
  }

  // ========== 方法 2: 评价数估算 ==========
  if (reviewCount && reviewCount > 0 && productAge) {
    const reviewEstimate = estimateSalesFromReviews(reviewCount, productAge, category);
    breakdown.reviewEstimate = reviewEstimate;

    // 将月均销量转换为日销量
    const reviewDailySales = Math.round(reviewEstimate.monthlySales / 30);

    dailySales += reviewDailySales * 0.3;
    totalConfidence += reviewEstimate.confidence * 0.3;
    weights.review = 0.3;
    method = method ? `${method}+Review` : 'Review';
  }

  // ========== 方法 3: 其他信号调整 ==========
  let otherSignalMultiplier = 1.0;
  let otherSignalConfidence = 0.5;

  // 评价增长率信号
  if (reviewGrowthRate !== undefined) {
    if (reviewGrowthRate > 0.5) {
      // 评价快速增长，销量可能被低估
      otherSignalMultiplier *= 1.2;
      otherSignalConfidence += 0.1;
    } else if (reviewGrowthRate < -0.2) {
      // 评价负增长，销量可能被高估
      otherSignalMultiplier *= 0.8;
      otherSignalConfidence += 0.05;
    }
  }

  // 库存状态信号
  if (availability) {
    if (availability === 'out_of_stock') {
      // 缺货，当前销量为 0
      otherSignalMultiplier *= 0;
      otherSignalConfidence += 0.2;
    } else if (availability === 'low_stock') {
      // 库存紧张，可能是热销
      otherSignalMultiplier *= 1.1;
      otherSignalConfidence += 0.1;
    }
  }

  // 价格信号（预留，需要类目平均价格数据）
  if (price !== undefined) {
    // 未来可以基于价格区间调整估算
    // 例如：高价产品通常销量较低但利润高
  }

  // 应用其他信号调整
  if (otherSignalMultiplier !== 1.0) {
    dailySales *= otherSignalMultiplier;
    totalConfidence += otherSignalConfidence * 0.1;
    weights.other = 0.1;
    method = method ? `${method}+Signals` : 'Signals';
  }

  // ========== 归一化权重 ==========
  const totalWeight = weights.bsr + weights.review + weights.other;
  if (totalWeight > 0) {
    weights.bsr /= totalWeight;
    weights.review /= totalWeight;
    weights.other /= totalWeight;
  }

  breakdown.weights = weights;

  // ========== 最终结果 ==========
  dailySales = Math.max(0, Math.round(dailySales));
  const monthlySales = dailySales * 30;

  // 置信度归一化到 0-1
  const confidence = Math.min(1, Math.max(0, totalConfidence));

  // 如果没有任何有效数据
  if (dailySales === 0 || method === '') {
    return {
      dailySales: 0,
      monthlySales: 0,
      confidence: 0,
      method: 'insufficient_data',
      breakdown: {}
    };
  }

  return {
    dailySales,
    monthlySales,
    confidence,
    method,
    breakdown
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取支持的类目列表
 */
export function getSupportedCategories(): string[] {
  return Object.keys(CATEGORY_CONFIGS).filter(cat => cat !== 'default');
}

/**
 * 获取类目配置
 */
export function getCategoryConfig(category: string): CategoryConfig | null {
  return CATEGORY_CONFIGS[category] || null;
}

/**
 * 验证 BSR 范围
 */
export function isValidBSR(bsr: number): boolean {
  return bsr > 0 && bsr <= 10000000; // Amazon BSR 最大值约 1000 万
}

/**
 * 计算销量置信区间
 *
 * @param estimate - 销量估算结果
 * @param confidenceLevel - 置信水平（默认 0.95）
 */
export function calculateConfidenceInterval(
  estimate: SalesEstimate,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // 基于置信度计算误差范围
  const errorMargin = (1 - estimate.confidence) * estimate.dailySales;

  // Z-score for 95% confidence ≈ 1.96
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645;
  const margin = errorMargin * zScore;

  return {
    lower: Math.max(0, Math.round(estimate.dailySales - margin)),
    upper: Math.round(estimate.dailySales + margin)
  };
}
