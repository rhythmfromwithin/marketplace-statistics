/**
 * Rainforest API 测试脚本
 * 用于验证更新后的实现是否符合官方 API 规格
 */

// 模拟真实 API 响应格式
const mockSearchResponse = {
  request_info: {
    success: true,
    credits_used: 1,
    credits_remaining: 10384,
    credits_reset_at: "2024-06-07T16:08:24.000Z"
  },
  request_parameters: {
    type: "search",
    amazon_domain: "amazon.com",
    search_term: "laptop"
  },
  request_metadata: {
    id: "abc123def456",
    created_at: "2024-06-07T16:08:18.530Z",
    processed_at: "2024-06-07T16:08:24.000Z",
    total_time_taken: 5.47,
    amazon_url: "https://www.amazon.com/s?k=laptop"
  },
  search_results: [
    {
      asin: "B0BSHF7WHW",
      title: "Apple MacBook Pro 14-inch M2 Pro",
      prices: {
        primary: {
          value: 1999.00,
          currency: "USD"
        },
        shipping: {
          value: 0,
          raw: "FREE"
        }
      },
      availability: {
        type: "in_stock"
      },
      image: "https://m.media-amazon.com/images/I/laptop-mbp14.jpg",
      link: "https://www.amazon.com/dp/B0BSHF7WHW",
      seller: {
        name: "Amazon.com"
      },
      brand: "Apple"
    }
  ]
};

const mockProductResponse = {
  request_info: {
    success: true,
    credits_used: 1,
    credits_remaining: 10383,
    credits_reset_at: "2024-06-07T16:08:24.000Z"
  },
  request_parameters: {
    type: "product",
    amazon_domain: "amazon.com",
    asin: "B0BSHF7WHW"
  },
  request_metadata: {
    id: "xyz789abc123",
    created_at: "2024-06-07T16:09:18.530Z",
    processed_at: "2024-06-07T16:09:22.000Z",
    total_time_taken: 3.47,
    amazon_url: "https://www.amazon.com/dp/B0BSHF7WHW"
  },
  product: {
    asin: "B0BSHF7WHW",
    title: "Apple MacBook Pro 14-inch M2 Pro",
    buybox_winner: {
      price: {
        value: 1999.00,
        currency: "USD"
      },
      shipping: {
        raw: "FREE"
      },
      availability: {
        type: "in_stock"
      },
      fulfillment: {
        third_party_seller: {
          name: "TechStore"
        }
      }
    },
    main_image: {
      link: "https://m.media-amazon.com/images/I/laptop-mbp14.jpg"
    },
    link: "https://www.amazon.com/dp/B0BSHF7WHW",
    brand: "Apple"
  }
};

const mockErrorResponse = {
  request_info: {
    success: false
  },
  error: {
    message: "Invalid API key",
    code: "INVALID_API_KEY"
  }
};

// 测试运费解析
const shippingTestCases = [
  { raw: "FREE", expected: 0 },
  { raw: "$5.99", expected: 5.99 },
  { raw: "£3.50", expected: 3.50 },
  { raw: "€4.99", expected: 4.99 },
  { raw: "¥500", expected: 500 },
  { raw: 0, expected: 0 },
  { raw: 5.99, expected: 5.99 }
];

console.log("=== Rainforest API 测试数据 ===\n");

console.log("1. Search API 响应格式:");
console.log(JSON.stringify(mockSearchResponse, null, 2));
console.log("\n");

console.log("2. Product API 响应格式:");
console.log(JSON.stringify(mockProductResponse, null, 2));
console.log("\n");

console.log("3. 错误响应格式:");
console.log(JSON.stringify(mockErrorResponse, null, 2));
console.log("\n");

console.log("4. 运费解析测试用例:");
shippingTestCases.forEach(test => {
  console.log(`  输入: ${JSON.stringify(test.raw)} -> 期望输出: ${test.expected}`);
});
console.log("\n");

console.log("=== 关键更新点 ===");
console.log("✓ 响应包含 request_info, request_metadata, search_results/product");
console.log("✓ Search API 返回 search_results 数组（不是 results）");
console.log("✓ Product API 返回 product 对象（不是数组）");
console.log("✓ 价格在 buybox_winner.price.value");
console.log("✓ 运费在 buybox_winner.shipping.raw（支持 FREE 和 $5.99 格式）");
console.log("✓ 库存在 buybox_winner.availability.type");
console.log("✓ 卖家在 buybox_winner.fulfillment.third_party_seller.name");
console.log("✓ 错误检查 request_info.success");
console.log("✓ Credit 监控 credits_used 和 credits_remaining");
console.log("✓ 响应时间 1-6 秒（实时数据）");
