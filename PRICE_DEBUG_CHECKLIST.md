# Price Debug Checklist (Amazon / Rainforest)

快速定位"价格不对"问题，按顺序执行，通常 1-2 分钟能定位。

## 1) 先确认是不是最新快照
- 在 Dashboard 看该商品的"最后更新时间"
- 如果不是刚更新，先点击一次"获取价格（Poll）"
- 再刷新页面确认最新值

## 2) 核对价格口径（最常见混淆）
- `current_price` = 商品价格（不含运费）
- `landed_price` = 到手价（商品价 + 运费）
- 和 Amazon 页面对账前，先确认你对的是哪个口径

## 3) 核对 ASIN 是否完全一致
- 在 Products 页面检查 `platformProductId`
- 必须与 Amazon 页面对应商品 ASIN 一致
- 同款不同变体 ASIN 不同，价格会不一致

## 4) 确认轮询调用成功
- 点击"获取价格"后应显示成功提示
- 若失败，查看后端日志是否出现 `prices.poll` 错误

## 5) 确认使用真实 API（非 Mock）
- `USE_MOCK_API=false`
- `RAINFOREST_API_KEY` 已配置且有效
- 否则数据可能是模拟数据或请求失败降级结果

## 6) 对照 Rainforest 原始价格字段
- 重点字段：
  - `buybox_winner.price`
  - `buybox_winner.shipping`
- 若原始字段正确但页面错，说明是映射/解析或展示层问题

## 7) 判断是否旧数据残留
- 如果手动 Poll 一次后马上恢复正常
- 通常是旧快照导致，不是当前抓取结果错误

---

## 极简版（3步）
1. Poll 一次并刷新页面
2. 确认看的是 `current_price` 还是 `landed_price`
3. 确认 `platformProductId`（ASIN）与 Amazon 页面一致
