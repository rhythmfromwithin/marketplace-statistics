# 第三方 API 集成指南

## 已实现功能

### 1. eBay Browse API 集成 ✅
**文件**: `server/platforms/ebay.ts`

**功能**:
- OAuth 2.0 认证（Application Token）
- 商品搜索（`search`）
- 价格获取（`getPrice`）
- 令牌桶限速器（5 req/s, burst 10）
- 指数退避重试机制（最多 3 次）
- 自动 token 刷新

**API 端点**:
- 搜索: `GET /buy/browse/v1/item_summary/search`
- 详情: `GET /buy/browse/v1/item/{itemId}`

**Rate Limit**: 5 req/s，默认 5,000次/天

---

### 2. Etsy Open API v3 集成 ✅
**文件**: `server/platforms/etsy.ts`

**功能**:
- API Key 认证（无需 OAuth）
- 商品搜索（`search`）
- 价格获取（`getPrice`）
- 令牌桶限速器（10 req/s, burst 20）
- 指数退避重试机制（最多 3 次）

**API 端点**:
- 搜索: `GET /v3/application/listings/active`
- 详情: `GET /v3/application/listings/{listingId}`

**Rate Limit**: 10 req/s，10,000次/天

---

### 3. Rainforest API 集成 ✅
**文件**: `server/platforms/rainforest.ts`

**功能**:
- API Key 认证（简单直接）
- Amazon 商品搜索（`search`）
- 价格获取（`getPrice`）
- 令牌桶限速器（2 req/s, burst 5）
- 指数退避重试机制（最多 3 次）
- 支持所有 Amazon 市场（US, UK, DE, JP 等）
- Credit 使用情况监控和日志记录

**API 端点**:
- 搜索: `GET /request?type=search&amazon_domain=...`
- 详情: `GET /request?type=product&asin=...`

**Rate Limit**: 2 req/s（保守限速，根据套餐不同）

**响应时间**: 1-6 秒（实时数据获取）

**响应数据结构**:
```json
{
  "request_info": {
    "success": true,
    "credits_used": 1,
    "credits_remaining": 10384,
    "credits_reset_at": "2024-06-07T16:08:24.000Z"
  },
  "request_parameters": {
    "type": "search",
    "amazon_domain": "amazon.com",
    "search_term": "laptop"
  },
  "request_metadata": {
    "id": "abc123...",
    "created_at": "2024-06-07T16:08:18.530Z",
    "processed_at": "2024-06-07T16:08:24.000Z",
    "total_time_taken": 5.47,
    "amazon_url": "https://www.amazon.com/s?k=laptop"
  },
  "search_results": [
    {
      "asin": "B0BSHF7WHW",
      "title": "Apple MacBook Pro 14-inch M2 Pro",
      "prices": {
        "primary": {
          "value": 1999.00,
          "currency": "USD"
        },
        "shipping": {
          "value": 0,
          "raw": "FREE"
        }
      },
      "availability": {
        "type": "in_stock"
      },
      "image": "https://m.media-amazon.com/images/I/...",
      "link": "https://www.amazon.com/dp/B0BSHF7WHW",
      "seller": {
        "name": "Amazon.com"
      },
      "brand": "Apple"
    }
  ]
}
```

**Product API 响应**:
```json
{
  "request_info": { "success": true, "credits_used": 1, ... },
  "product": {
    "asin": "B0BSHF7WHW",
    "title": "Apple MacBook Pro 14-inch M2 Pro",
    "buybox_winner": {
      "price": {
        "value": 1999.00,
        "currency": "USD"
      },
      "shipping": {
        "raw": "FREE"
      },
      "availability": {
        "type": "in_stock"
      },
      "fulfillment": {
        "third_party_seller": {
          "name": "TechStore"
        }
      }
    },
    "main_image": {
      "link": "https://m.media-amazon.com/images/I/..."
    },
    "link": "https://www.amazon.com/dp/B0BSHF7WHW"
  }
}
```

**错误处理**:
```json
{
  "request_info": {
    "success": false
  },
  "error": {
    "message": "Invalid API key",
    "code": "INVALID_API_KEY"
  }
}
```

**特点**:
- 专注 Amazon 数据抓取，无需 Amazon 官方权限
- 获取 ASIN、价格、运费、卖家信息、BuyBox、库存状态
- 支持 12+ Amazon 市场（US, UK, DE, FR, IT, ES, CA, JP, IN, MX, BR, AU）
- 开箱即用，无需复杂的 OAuth 流程
- 实时数据，所有请求都是实时抓取（1-6秒响应时间）
- Credit 系统，每次请求消耗 1 credit
- 运费支持多种格式："FREE" 或 "$5.99" 等

---

### 4. 统一平台管理器 ✅
**文件**: `server/platforms/index.ts`

**功能**:
- 工厂模式，根据平台类型返回对应 API 实例
- 单例模式，避免重复创建实例
- 跨平台搜索（`searchAcrossPlatforms`）
- 统一错误处理
- 支持 Mock 模式（开发测试用）

**使用示例**:
```typescript
import { platformManager } from "./platforms/index";

// 获取 eBay API
const ebayAPI = platformManager.getEbayAPI();

// 获取 Etsy API
const etsyAPI = platformManager.getEtsyAPI();

// 获取 Rainforest API (Amazon)
const rainforestAPI = platformManager.getRainforestAPI();

// 跨平台搜索
const results = await platformManager.searchAcrossPlatforms(
  "laptop",
  ["ebay", "etsy", "amazon"],
  20
);
```

---

### 5. Mock API 实现 ✅
**文件**: `server/platforms/mock.ts`, `server/platforms/mockData.ts`

**功能**:
- 完整的 Mock 数据生成器
- 支持 eBay、Etsy、Amazon 三个平台
- 真实感的价格波动（±5%）
- 模拟网络延迟
- 模拟限速器

**使用场景**:
- 开发测试（无需真实 API 密钥）
- 演示和原型验证
- 单元测试和集成测试

**启用方式**:
```bash
# 在 .env.local 中设置
USE_MOCK_API=true
```

---

### 6. 路由集成 ✅
**文件**: `server/routers.ts`

**新增端点**:

#### `products.search` - 跨平台商品搜索
```typescript
// 输入
{
  keyword: string;
  platforms: ("ebay" | "etsy" | "amazon")[];
  limit: number; // 默认 20
}

// 输出
[
  {
    platform: "ebay",
    results: [
      {
        platformProductId: "v1|123456789|0",
        title: "Dell XPS 13 Laptop",
        currentPrice: 899.99,
        shippingPrice: 0,
        landedPrice: 899.99,
        sellerId: "seller123",
        availability: "in_stock",
        imageUrl: "https://...",
        productUrl: "https://...",
        currency: "USD"
      }
    ]
  },
  {
    platform: "amazon",
    results: [
      {
        platformProductId: "B0BSHF7WHW",
        title: "Apple MacBook Pro 14-inch M2 Pro",
        currentPrice: 1999.00,
        shippingPrice: 0,
        landedPrice: 1999.00,
        sellerId: "Amazon.com",
        availability: "in_stock",
        imageUrl: "https://...",
        productUrl: "https://...",
        currency: "USD"
      }
    ]
  }
]
```

#### `prices.poll` - 真实 API 价格轮询
```typescript
// 输入
{
  trackedProductId: number;
}

// 输出
{
  polled: 1,
  triggered: [
    {
      platform: "ebay",
      changePct: 5.2,
      direction: "up"
    }
  ],
  priceData: {
    platformProductId: "...",
    currentPrice: 899.99,
    // ...
  }
}
```

---

## 环境变量配置

### `.env.local` 配置示例

```bash
# Mock API 模式 (开发测试用)
USE_MOCK_API=true

# eBay Browse API
EBAY_CLIENT_ID=your_ebay_client_id_here
EBAY_CLIENT_SECRET=your_ebay_client_secret_here

# Etsy Open API v3
ETSY_API_KEY=your_etsy_api_key_here

# Rainforest API (Amazon 数据抓取)
RAINFOREST_API_KEY=your_rainforest_api_key_here
RAINFOREST_MARKETPLACE=US
```

---

## 如何申请 API Key

### eBay Browse API

1. 访问 [eBay Developers Program](https://developer.ebay.com/)
2. 注册开发者账号
3. 创建应用（Application）
4. 获取 **App ID (Client ID)** 和 **Cert ID (Client Secret)**
5. 将凭证添加到 `.env.local`

**审批时间**: 即时（无需人工审核）
**费用**: 完全免费
**限制**: 5,000次/天（可申请提升至 50,000次/天）

---

### Etsy Open API v3

1. 访问 [Etsy Developer Portal](https://developer.etsy.com/)
2. 注册开发者账号
3. 创建应用
4. 获取 **API Key (Keystring)**
5. 将 API Key 添加到 `.env.local`

**审批时间**: 即时
**费用**: 完全免费
**限制**: 10,000次/天

---

### Rainforest API

1. 访问 [Rainforest API](https://www.rainforestapi.com/)
2. 注册账号
3. 选择合适的套餐（有免费试用）
4. 获取 **API Key**
5. 将 API Key 添加到 `.env.local`
6. 设置 **Marketplace**（US, UK, DE, JP 等）

**审批时间**: 即时
**费用**: 付费服务（有免费试用额度）
- Starter: $49/月（10,000 请求）
- Growth: $149/月（50,000 请求）
- Pro: $499/月（200,000 请求）
**限制**: 根据套餐不同，建议保守限速 2 req/s

**响应时间**: 1-6 秒（所有数据都是实时获取）

**Credit 系统**:
- 每次 API 请求消耗 1 credit
- 响应中包含 `credits_used` 和 `credits_remaining`
- 系统自动记录 credit 使用情况到日志

**支持的市场**:
- US (amazon.com)
- UK (amazon.co.uk)
- DE (amazon.de)
- FR (amazon.fr)
- IT (amazon.it)
- ES (amazon.es)
- CA (amazon.ca)
- JP (amazon.co.jp)
- IN (amazon.in)
- MX (amazon.com.mx)
- BR (amazon.com.br)
- AU (amazon.com.au)

**customer_location 参数**:
可选参数，用于获取特定地区的价格和运费信息。例如：
- `customer_location=90210` (美国邮编)
- `customer_location=SW1A+1AA` (英国邮编)

**运费格式**:
- 免费运费: `"FREE"`
- 付费运费: `"$5.99"`, `"£3.50"` 等
- 系统自动解析并转换为数字

---

## 测试步骤

### 1. 配置环境变量
```bash
cd /Users/gztd-03-02619/Q2/product_price_intelligence/price-intel
cp .env.local .env.local.backup
# 编辑 .env.local，填入真实的 API 凭证
```

### 2. 测试 eBay API
```typescript
// 在 Node.js REPL 或测试文件中
import { platformManager } from "./server/platforms/index";

const ebayAPI = platformManager.getEbayAPI();

// 测试搜索
const results = await ebayAPI.search("laptop", 5);
console.log(results);

// 测试获取价格
const price = await ebayAPI.getPrice(results[0].platformProductId);
console.log(price);
```

### 3. 测试 Etsy API
```typescript
const etsyAPI = platformManager.getEtsyAPI();

// 测试搜索
const results = await etsyAPI.search("handmade wallet", 5);
console.log(results);

// 测试获取价格
const price = await etsyAPI.getPrice(results[0].platformProductId);
console.log(price);
```

### 4. 测试 Rainforest API (Amazon)
```typescript
const rainforestAPI = platformManager.getRainforestAPI();

// 测试搜索
const results = await rainforestAPI.search("laptop", 5);
console.log(results);

// 测试获取价格（使用 ASIN）
const price = await rainforestAPI.getPrice(results[0].platformProductId);
console.log(price);
```

### 5. 测试跨平台搜索
```typescript
const results = await platformManager.searchAcrossPlatforms(
  "laptop",
  ["ebay", "etsy", "amazon"],
  10
);
console.log(JSON.stringify(results, null, 2));
```

### 6. 测试 tRPC 端点
启动开发服务器后，在前端调用：
```typescript
// 搜索商品
const searchResults = await trpc.products.search.query({
  keyword: "laptop",
  platforms: ["ebay", "etsy", "amazon"],
  limit: 20
});

// 轮询价格
const pollResult = await trpc.prices.poll.mutate({
  trackedProductId: 1
});
```

---

## 架构设计

### 统一抽象层
```
server/platforms/
├── base.ts          # 接口定义和限速器
├── ebay.ts          # eBay API 实现
├── etsy.ts          # Etsy API 实现
├── rainforest.ts    # Rainforest API 实现 (Amazon)
├── mock.ts          # Mock API 实现
├── mockData.ts      # Mock 数据生成器
└── index.ts         # 平台管理器（工厂模式）
```

### 数据流
```
前端 (React)
    ↓ tRPC
server/routers.ts
    ↓
server/platforms/index.ts (platformManager)
    ↓
server/platforms/ebay.ts | etsy.ts | rainforest.ts
    ↓ HTTP
eBay API | Etsy API | Rainforest API (Amazon)
```

---

## 关键特性

### 1. 令牌桶限速器
- eBay: 5 req/s, burst 10
- Etsy: 10 req/s, burst 20
- Rainforest: 2 req/s, burst 5
- 自动等待，避免超出限制

### 2. 指数退避重试
- 最多重试 3 次
- 延迟: 500ms → 1s → 2s
- 自动处理 401 错误（刷新 token）

### 3. 错误处理
- 统一错误格式
- 详细日志记录
- 优雅降级（某个平台失败不影响其他平台）

### 4. 类型安全
- 完整的 TypeScript 类型定义
- 统一的数据格式（`SearchResult`, `PriceData`）

---

## 下一步工作

### 短期（1-2周）
- [ ] 申请 eBay 和 Etsy API 凭证
- [ ] 测试真实 API 调用
- [ ] 添加单元测试
- [ ] 添加集成测试

### 中期（1个月）
- [ ] 实现定时轮询服务（cron job）
- [ ] 添加 Redis 缓存层
- [ ] 实现 WebSocket 实时推送
- [ ] 优化数据库查询性能

### 长期（3个月）
- [ ] 添加 Amazon API（如果需要）
- [ ] 添加 Shopify API（如果需要）
- [ ] 实现智能定价算法
- [ ] 添加价格预测功能

---

## 成本估算

### API 调用成本
- **eBay**: 免费（5,000次/天）
- **Etsy**: 免费（10,000次/天）
- **Rainforest**: 付费（根据套餐，$49-$499/月）
- **总计**: ¥0-¥3,500/月（取决于是否使用 Amazon 数据）

### 基础设施成本
- 服务器: ¥250/月（阿里云 ECS 2核4G）
- 数据库: ¥350/月（阿里云 RDS MySQL）
- Redis: ¥100/月（阿里云 Redis）
- **总计**: ¥700/月

---

## 常见问题

### Q: 为什么不支持 Amazon 官方 API？
A: Amazon PA-API 5.0 将于 2026年4月30日废弃，且需要联盟销售才能使用，不适合纯价格监控工具。我们使用 Rainforest API 作为替代方案，无需 Amazon 官方权限即可获取数据。

### Q: Rainforest API 和 Amazon PA-API 有什么区别？
A: 
- Rainforest API 是第三方数据抓取服务，无需 Amazon 官方权限
- 支持所有 Amazon 市场，数据更全面
- 付费服务，但使用简单，无需复杂的联盟销售要求
- 适合价格监控、竞品分析等场景

### Q: 如何提升 API 配额？
A: 
- eBay: 联系开发者支持申请提升至 50,000次/天
- Etsy: 默认 10,000次/天已足够大多数应用
- Rainforest: 升级套餐获得更多请求额度

### Q: 如何处理 API 限速？
A: 已实现令牌桶限速器，自动控制请求速率，无需手动处理。

### Q: 如何监控 API 使用量？
A: 建议添加日志记录和监控告警，跟踪每日 API 调用次数。

### Q: Mock 模式如何使用？
A: 在 `.env.local` 中设置 `USE_MOCK_API=true`，系统将使用模拟数据，无需真实 API 密钥，适合开发测试。

---

## 联系方式

如有问题，请查看：
- [eBay API 文档](https://developer.ebay.com/api-docs/buy/browse/resources/methods)
- [Etsy API 文档](https://developer.etsy.com/documentation/)
- [Rainforest API 文档](https://docs.rainforestapi.com/)
- [项目实现方案](./IMPLEMENTATION_PLAN.md)
- [部署路线图](./DEPLOYMENT_ROADMAP.md)
