# Rainforest API 更新摘要

## 更新日期
2026年4月21日

## 更新目的
根据 Rainforest API 官方文档 (https://docs.trajectdata.com/rainforestapi/product-data-api/overview) 更新实现代码，确保与真实 API 规格完全匹配。

---

## 主要更新内容

### 1. 响应数据结构更新

#### 之前的实现问题
- 直接访问 `data.search_results` 和 `data.product`
- 没有检查 `request_info.success` 状态
- 没有记录 credit 使用情况
- 运费解析不完整（只支持数字格式）

#### 更新后的实现
- 完整的响应结构包含：
  - `request_info`: API 调用状态和 credit 信息
  - `request_parameters`: 请求参数
  - `request_metadata`: 请求元数据（ID、时间等）
  - `search_results` 或 `product`: 实际数据

### 2. Search API (type=search) 更新

**文件**: `server/platforms/rainforest.ts`

**关键更改**:
```typescript
// 添加错误检查
if (!data.request_info?.success) {
  const errorMsg = data.error?.message || "Unknown error";
  throw new Error(`Rainforest API error: ${errorMsg}`);
}

// 添加 credit 日志
console.log(
  `[Rainforest] Credits used: ${data.request_info.credits_used}, ` +
  `remaining: ${data.request_info.credits_remaining}`
);

// 使用 search_results（不是 results）
if (!data.search_results || data.search_results.length === 0) {
  return [];
}
```

**字段映射**:
- `item.asin` → `platformProductId`
- `item.prices?.primary?.value` → `currentPrice`
- `item.prices?.shipping?.value` → `shippingPrice`
- `item.availability?.type` → `availability`
- `item.seller?.name ?? item.brand` → `sellerId`
- `item.image` → `imageUrl`
- `item.link` → `productUrl`

### 3. Product API (type=product) 更新

**关键更改**:
```typescript
// 检查 product 对象存在
if (!data.product) {
  throw new Error(`Rainforest: Product not found for ASIN: ${asin}`);
}

return this.mapToPriceData(data.product);
```

**字段映射**:
- `product.buybox_winner.price.value` → `currentPrice`
- `product.buybox_winner.shipping.raw` → `shippingPrice` (需要解析)
- `product.buybox_winner.availability.type` → `availability`
- `product.buybox_winner.fulfillment.third_party_seller.name` → `sellerId`
- `product.main_image.link` → `imageUrl`

### 4. 运费解析增强

**新增功能**: 支持多种运费格式

```typescript
// 解析运费 - 可能是 "FREE" 或 "$5.99" 格式
let shipping = 0;
const shippingRaw = buybox?.shipping?.raw ?? buybox?.shipping?.value;
if (shippingRaw) {
  if (typeof shippingRaw === "string") {
    if (shippingRaw.toUpperCase() === "FREE") {
      shipping = 0;
    } else {
      // 提取数字部分 (例如 "$5.99" -> 5.99)
      const match = shippingRaw.match(/[\d.]+/);
      shipping = match ? parseFloat(match[0]) : 0;
    }
  } else {
    shipping = parseFloat(shippingRaw) || 0;
  }
}
```

**支持的格式**:
- `"FREE"` → 0
- `"$5.99"` → 5.99
- `"£3.50"` → 3.50
- `"€4.99"` → 4.99
- `0` → 0
- `5.99` → 5.99

### 5. Mock API 更新

**文件**: `server/platforms/mock.ts`

**关键更改**:
- 响应时间从 150-400ms 更新为 1000-6000ms（模拟真实 API）
- 添加 credit 计数器和日志记录
- 添加 credit 使用情况的控制台输出

```typescript
private creditsRemaining: number = 10000;

// 模拟真实 API 的响应时间：1-6秒
await this.simulateNetworkDelay(1000, 6000);

// 模拟 credit 消耗
this.creditsRemaining -= 1;

// 记录 credit 使用情况（模拟真实 API）
console.log(
  `[Mock Rainforest] Credits used: 1, remaining: ${this.creditsRemaining}`
);
```

### 6. 文档更新

**文件**: `API_INTEGRATION_GUIDE.md`

**新增内容**:
- 完整的响应数据结构示例（Search 和 Product）
- 错误响应格式示例
- 响应时间说明（1-6 秒）
- Credit 系统详细说明
- 支持的 Amazon 市场列表（12 个市场）
- customer_location 参数说明
- 运费格式说明

---

## 测试验证

### 测试文件
创建了 `test-rainforest-api.ts` 包含：
- Mock 响应数据示例
- 运费解析测试用例
- 关键更新点清单

### 测试步骤
1. 使用 Mock 模式测试（`USE_MOCK_API=true`）
2. 验证响应时间（1-6 秒）
3. 验证 credit 日志输出
4. 验证运费解析（FREE 和 $5.99 格式）
5. 验证错误处理（request_info.success = false）

---

## 兼容性说明

### 向后兼容
- 所有现有的接口签名保持不变
- `SearchResult` 和 `PriceData` 类型定义未改变
- 现有的调用代码无需修改

### 新增功能
- Credit 使用情况监控
- 更强大的运费解析
- 更完善的错误处理
- 更真实的 Mock 数据

---

## 性能影响

### 响应时间
- **真实 API**: 1-6 秒（实时数据获取）
- **Mock API**: 1-6 秒（模拟真实延迟）
- **之前的 Mock**: 150-400ms

### 注意事项
真实 API 的响应时间较长是因为：
- 实时抓取 Amazon 数据
- 需要处理反爬虫机制
- 需要解析动态内容

建议：
- 使用缓存减少重复请求
- 实现请求队列避免并发过高
- 添加超时处理（建议 10 秒）

---

## Credit 管理建议

### 监控策略
1. 记录每次 API 调用的 credit 消耗
2. 设置 credit 余额告警（例如 < 1000）
3. 定期检查 credit 重置时间
4. 实现 credit 用量统计和报表

### 优化策略
1. 使用缓存减少重复查询
2. 批量处理降低请求频率
3. 只在必要时调用 Product API
4. 优先使用 Search API（数据已足够）

---

## 已更新的文件清单

1. ✅ `server/platforms/rainforest.ts`
   - 更新 `search()` 方法
   - 更新 `getPrice()` 方法
   - 更新 `mapToPriceData()` 方法
   - 添加错误检查和 credit 日志

2. ✅ `server/platforms/mock.ts`
   - 更新 `MockRainforestAPI` 类
   - 模拟 1-6 秒响应时间
   - 添加 credit 计数器和日志

3. ✅ `API_INTEGRATION_GUIDE.md`
   - 添加完整的响应数据结构
   - 添加错误处理示例
   - 添加 credit 系统说明
   - 添加运费格式说明

4. ✅ `.env.local`
   - 已包含 `RAINFOREST_MARKETPLACE` 配置
   - 无需额外修改

5. ✅ `test-rainforest-api.ts`
   - 新增测试文件
   - 包含 Mock 响应示例
   - 包含测试用例

6. ✅ `RAINFOREST_API_UPDATE_SUMMARY.md`
   - 本文档

---

## 下一步建议

### 短期（本周）
- [ ] 运行测试验证更新
- [ ] 检查日志输出是否正确
- [ ] 测试运费解析功能
- [ ] 测试错误处理

### 中期（本月）
- [ ] 申请真实 Rainforest API Key
- [ ] 使用真实 API 进行集成测试
- [ ] 实现 credit 用量监控
- [ ] 添加缓存层减少 API 调用

### 长期（下季度）
- [ ] 实现智能请求调度
- [ ] 添加 credit 用量预测
- [ ] 优化数据更新策略
- [ ] 实现多市场支持

---

## 参考资料

- [Rainforest API 官方文档](https://docs.trajectdata.com/rainforestapi/product-data-api/overview)
- [Rainforest API 定价](https://www.rainforestapi.com/pricing)
- [Amazon 市场列表](https://www.rainforestapi.com/docs/product-data-api/parameters#amazon_domain)

---

## 联系方式

如有问题或需要进一步说明，请参考：
- 项目文档: `API_INTEGRATION_GUIDE.md`
- 测试文件: `test-rainforest-api.ts`
- 实现代码: `server/platforms/rainforest.ts`
