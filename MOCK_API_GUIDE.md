# Mock API 使用指南

## 概述

Mock API 层提供了完整的 eBay 和 Etsy API 模拟实现，让你在等待真实 API 审批期间可以测试整个产品流程。Mock API 完全实现了 `PlatformAPI` 接口，前端和后端代码无需任何修改即可在 Mock 模式和真实模式之间切换。

## 快速开始

### 1. 启用 Mock 模式

编辑 `.env.local` 文件，设置：

```bash
USE_MOCK_API=true
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试搜索功能

Mock API 会自动返回模拟数据，你可以搜索以下关键词测试：

**eBay 商品类别：**
- `laptop` - 笔记本电脑（Dell XPS, HP Pavilion, Lenovo ThinkPad 等）
- `phone` - 智能手机（iPhone, Samsung Galaxy, Google Pixel 等）
- `headphones` - 耳机（Sony, Apple AirPods, Bose 等）
- `camera` - 相机（Canon, Sony, Nikon 等）
- `watch` - 智能手表（Apple Watch, Samsung Galaxy Watch 等）

**Etsy 商品类别：**
- `jewelry` - 手工珠宝（戒指、项链、耳环等）
- `home decor` - 家居装饰（挂毯、花盆、蜡烛等）
- `bag` - 手工包包（皮革包、帆布包等）
- `stationery` - 文具纸品（日记本、邀请函等）
- `toy` - 手工玩具（木制玩具、布娃娃等）

## Mock 数据特点

### 1. 真实感强

所有商品数据都使用真实的商品名称、合理的价格范围和真实的卖家名称：

```typescript
// eBay 示例
{
  title: "Dell XPS 13 9320 Laptop Intel i7-1260P 16GB RAM 512GB SSD",
  currentPrice: 899.99,
  seller: "techdeals_official"
}

// Etsy 示例
{
  title: "Handmade Sterling Silver Moonstone Ring Boho Style Size 7",
  currentPrice: 68.50,
  seller: "MoonlightCreations"
}
```

### 2. 价格波动模拟

每次调用 API 时，价格会有 ±5% 的随机波动，模拟真实市场行为：

```typescript
// 第一次查询
currentPrice: 899.99

// 第二次查询（几分钟后）
currentPrice: 912.45  // +1.4% 波动
```

### 3. 库存状态变化

商品库存状态会随机变化（10% 概率）：
- `in_stock` - 有货
- `limited` - 库存有限
- `out_of_stock` - 缺货

### 4. 网络延迟模拟

Mock API 会模拟真实的网络延迟：
- eBay: 100-300ms
- Etsy: 80-250ms

### 5. 限速模拟

Mock API 实现了与真实 API 相同的限速机制：
- eBay: 5 req/s
- Etsy: 10 req/s

## 数据规模

- **eBay Mock 数据**: 20 个商品
  - 笔记本电脑: 5 个
  - 智能手机: 5 个
  - 耳机: 4 个
  - 相机: 4 个
  - 智能手表: 3 个

- **Etsy Mock 数据**: 20 个商品
  - 手工珠宝: 5 个
  - 家居装饰: 5 个
  - 服装配饰: 4 个
  - 文具纸品: 4 个
  - 玩具艺术: 3 个

## 切换到真实 API

当你的 API 申请通过后，按以下步骤切换：

### 1. 配置真实 API 密钥

编辑 `.env.local` 文件：

```bash
# 禁用 Mock 模式
USE_MOCK_API=false

# 配置 eBay API
EBAY_CLIENT_ID=your_real_ebay_client_id
EBAY_CLIENT_SECRET=your_real_ebay_client_secret

# 配置 Etsy API
ETSY_API_KEY=your_real_etsy_api_key
```

### 2. 重启开发服务器

```bash
npm run dev
```

### 3. 验证切换成功

查看控制台日志，确认没有 "Using Mock API" 的提示。

## 测试建议

### 1. 功能测试

使用 Mock API 测试以下功能：

- ✅ 商品搜索（关键词匹配）
- ✅ 价格查询（单个商品详情）
- ✅ 跨平台搜索（eBay + Etsy）
- ✅ 价格历史记录（多次查询同一商品）
- ✅ 库存状态变化
- ✅ 错误处理（查询不存在的商品）

### 2. 性能测试

Mock API 的限速机制与真实 API 一致，可以测试：

- ✅ 并发请求处理
- ✅ 限速器工作正常
- ✅ 响应时间合理

### 3. UI/UX 测试

使用 Mock 数据测试前端展示：

- ✅ 商品列表渲染
- ✅ 价格格式化
- ✅ 图片占位符
- ✅ 加载状态
- ✅ 错误提示

### 4. 集成测试

测试完整的用户流程：

1. 搜索商品 → 查看结果列表
2. 点击商品 → 查看详情页
3. 添加到监控 → 价格历史记录
4. 等待价格变化 → 接收通知

## 技术实现

### 架构设计

```
PlatformManager
├── Mock 模式检测 (USE_MOCK_API)
├── MockEbayAPI (实现 PlatformAPI)
│   ├── search() - 搜索商品
│   ├── getPrice() - 获取价格
│   └── 价格波动生成器
└── MockEtsyAPI (实现 PlatformAPI)
    ├── search() - 搜索商品
    ├── getPrice() - 获取价格
    └── 价格波动生成器
```

### 关键文件

- `server/platforms/mock.ts` - Mock API 实现
- `server/platforms/mockData.ts` - Mock 数据生成器
- `server/platforms/index.ts` - 平台管理器（支持 Mock 模式）
- `.env.local` - 环境变量配置

### 接口兼容性

Mock API 完全实现 `PlatformAPI` 接口：

```typescript
interface PlatformAPI {
  search(keyword: string, limit?: number): Promise<SearchResult[]>;
  getPrice(productId: string): Promise<PriceData>;
}
```

前端和后端代码无需任何修改即可在 Mock 模式和真实模式之间切换。

## 常见问题

### Q: Mock 数据会保存到数据库吗？

A: 会的。Mock API 返回的数据格式与真实 API 完全一致，会正常保存到数据库。切换到真实 API 后，历史数据仍然可用。

### Q: 如何添加更多 Mock 商品？

A: 编辑 `server/platforms/mockData.ts`，在 `MOCK_EBAY_PRODUCTS` 或 `MOCK_ETSY_PRODUCTS` 数组中添加新商品。

### Q: Mock API 支持所有真实 API 的功能吗？

A: 目前 Mock API 实现了核心功能（搜索和价格查询）。如果需要更多功能，可以扩展 Mock API 实现。

### Q: 价格波动的算法是什么？

A: 每次查询时，价格会在基础价格的 ±5% 范围内随机波动，模拟真实市场的价格变化。

### Q: 可以同时使用 Mock 和真实 API 吗？

A: 不可以。`USE_MOCK_API` 是全局开关，要么全部使用 Mock，要么全部使用真实 API。

## 下一步

1. ✅ 使用 Mock API 完成产品核心功能开发
2. ✅ 测试所有用户流程
3. ✅ 优化 UI/UX
4. ⏳ 等待 eBay 和 Etsy API 审批
5. ⏳ 切换到真实 API
6. ⏳ 生产环境部署

## 支持

如有问题，请查看：
- `server/platforms/base.ts` - API 接口定义
- `server/platforms/ebay.ts` - eBay 真实 API 实现
- `server/platforms/etsy.ts` - Etsy 真实 API 实现
