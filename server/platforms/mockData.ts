/**
 * Mock 数据生成器
 * 生成真实感的商品数据用于测试
 */

export interface MockProduct {
  id: string;
  title: string;
  basePrice: number;
  category: string;
  seller: string;
  imageUrl: string;
  currency: string;
  shippingBase: number;
  stockStatus: "in_stock" | "limited" | "out_of_stock";
}

/**
 * eBay 风格的 Mock 商品数据
 */
export const MOCK_EBAY_PRODUCTS: MockProduct[] = [
  // 笔记本电脑类
  { id: "ebay-334892156789", title: "Dell XPS 13 9320 Laptop Intel i7-1260P 16GB RAM 512GB SSD FHD+ Display", basePrice: 899.99, category: "laptop", seller: "techdeals_official", imageUrl: "https://i.ebayimg.com/images/g/laptop-xps13.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156790", title: "HP Pavilion 15 Laptop AMD Ryzen 5 8GB RAM 256GB SSD Windows 11", basePrice: 549.99, category: "laptop", seller: "hp_outlet_store", imageUrl: "https://i.ebayimg.com/images/g/laptop-hp15.jpg", currency: "USD", shippingBase: 12.99, stockStatus: "in_stock" },
  { id: "ebay-334892156791", title: "Lenovo ThinkPad X1 Carbon Gen 10 14\" i7-1255U 16GB 512GB SSD", basePrice: 1299.99, category: "laptop", seller: "lenovo_certified", imageUrl: "https://i.ebayimg.com/images/g/laptop-thinkpad.jpg", currency: "USD", shippingBase: 0, stockStatus: "limited" },
  { id: "ebay-334892156792", title: "ASUS ROG Strix G15 Gaming Laptop RTX 3060 AMD Ryzen 7 16GB 1TB", basePrice: 1099.99, category: "laptop", seller: "gaming_gear_pro", imageUrl: "https://i.ebayimg.com/images/g/laptop-rog.jpg", currency: "USD", shippingBase: 15.99, stockStatus: "in_stock" },
  { id: "ebay-334892156793", title: "MacBook Air M2 13.6\" 8GB RAM 256GB SSD Space Gray 2024", basePrice: 1049.99, category: "laptop", seller: "apple_authorized", imageUrl: "https://i.ebayimg.com/images/g/laptop-macair.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  
  // 手机类
  { id: "ebay-334892156794", title: "Samsung Galaxy S24 Ultra 256GB Titanium Gray Unlocked 5G", basePrice: 1199.99, category: "phone", seller: "samsung_direct", imageUrl: "https://i.ebayimg.com/images/g/phone-s24.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156795", title: "iPhone 15 Pro Max 256GB Natural Titanium Unlocked", basePrice: 1099.99, category: "phone", seller: "apple_authorized", imageUrl: "https://i.ebayimg.com/images/g/phone-iphone15.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156796", title: "Google Pixel 8 Pro 128GB Obsidian Black Factory Unlocked", basePrice: 799.99, category: "phone", seller: "google_store", imageUrl: "https://i.ebayimg.com/images/g/phone-pixel8.jpg", currency: "USD", shippingBase: 8.99, stockStatus: "limited" },
  { id: "ebay-334892156797", title: "OnePlus 12 5G 256GB Flowy Emerald Dual SIM Global Version", basePrice: 699.99, category: "phone", seller: "oneplus_official", imageUrl: "https://i.ebayimg.com/images/g/phone-oneplus.jpg", currency: "USD", shippingBase: 12.99, stockStatus: "in_stock" },
  { id: "ebay-334892156798", title: "Xiaomi 14 Pro 512GB Titanium Black Snapdragon 8 Gen 3", basePrice: 899.99, category: "phone", seller: "xiaomi_global", imageUrl: "https://i.ebayimg.com/images/g/phone-xiaomi.jpg", currency: "USD", shippingBase: 15.99, stockStatus: "in_stock" },
  
  // 耳机类
  { id: "ebay-334892156799", title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones Black", basePrice: 349.99, category: "headphones", seller: "sony_electronics", imageUrl: "https://i.ebayimg.com/images/g/headphones-sony.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156800", title: "Apple AirPods Pro 2nd Gen with MagSafe Charging Case USB-C", basePrice: 229.99, category: "headphones", seller: "apple_authorized", imageUrl: "https://i.ebayimg.com/images/g/headphones-airpods.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156801", title: "Bose QuietComfort Ultra Wireless Noise Cancelling Headphones", basePrice: 379.99, category: "headphones", seller: "bose_official", imageUrl: "https://i.ebayimg.com/images/g/headphones-bose.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156802", title: "Sennheiser Momentum 4 Wireless ANC Headphones 60H Battery", basePrice: 299.99, category: "headphones", seller: "audio_experts", imageUrl: "https://i.ebayimg.com/images/g/headphones-senn.jpg", currency: "USD", shippingBase: 9.99, stockStatus: "limited" },
  
  // 相机类
  { id: "ebay-334892156803", title: "Canon EOS R6 Mark II Mirrorless Camera Body Only", basePrice: 2399.99, category: "camera", seller: "canon_usa", imageUrl: "https://i.ebayimg.com/images/g/camera-canon.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156804", title: "Sony Alpha a7 IV Full Frame Mirrorless Camera Body", basePrice: 2299.99, category: "camera", seller: "sony_imaging", imageUrl: "https://i.ebayimg.com/images/g/camera-sony.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156805", title: "Nikon Z8 Mirrorless Camera Body 45.7MP 8K Video", basePrice: 3699.99, category: "camera", seller: "nikon_direct", imageUrl: "https://i.ebayimg.com/images/g/camera-nikon.jpg", currency: "USD", shippingBase: 0, stockStatus: "limited" },
  { id: "ebay-334892156806", title: "Fujifilm X-T5 Mirrorless Camera Silver Body 40.2MP", basePrice: 1599.99, category: "camera", seller: "fuji_store", imageUrl: "https://i.ebayimg.com/images/g/camera-fuji.jpg", currency: "USD", shippingBase: 12.99, stockStatus: "in_stock" },
  
  // 智能手表类
  { id: "ebay-334892156807", title: "Apple Watch Series 9 GPS 45mm Midnight Aluminum Sport Band", basePrice: 429.99, category: "watch", seller: "apple_authorized", imageUrl: "https://i.ebayimg.com/images/g/watch-apple.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156808", title: "Samsung Galaxy Watch 6 Classic 47mm Bluetooth Black", basePrice: 379.99, category: "watch", seller: "samsung_direct", imageUrl: "https://i.ebayimg.com/images/g/watch-samsung.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "ebay-334892156809", title: "Garmin Fenix 7X Sapphire Solar GPS Smartwatch 51mm", basePrice: 899.99, category: "watch", seller: "garmin_official", imageUrl: "https://i.ebayimg.com/images/g/watch-garmin.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
];

/**
 * Amazon 风格的 Mock 商品数据（通过 Rainforest API）
 */
export const MOCK_AMAZON_PRODUCTS: MockProduct[] = [
  // 笔记本电脑类
  { id: "B0BSHF7WHW", title: "Apple 2023 MacBook Pro Laptop M2 Pro chip 16GB RAM 512GB SSD 14-inch", basePrice: 1999.00, category: "laptop", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/laptop-mbp14.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0C75RKWH6", title: "ASUS Zenbook 14 OLED Laptop Intel Core Ultra 7 16GB RAM 1TB SSD", basePrice: 1299.99, category: "laptop", seller: "ASUS Official Store", imageUrl: "https://m.media-amazon.com/images/I/laptop-zenbook.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CCP26QVL", title: "Dell Inspiron 15 3000 Laptop AMD Ryzen 5 8GB RAM 512GB SSD", basePrice: 479.99, category: "laptop", seller: "Dell", imageUrl: "https://m.media-amazon.com/images/I/laptop-inspiron.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0BWQG1NQY", title: "Acer Nitro 5 Gaming Laptop RTX 4050 Intel i5-12500H 16GB 512GB", basePrice: 899.99, category: "laptop", seller: "Acer Direct", imageUrl: "https://m.media-amazon.com/images/I/laptop-nitro5.jpg", currency: "USD", shippingBase: 0, stockStatus: "limited" },
  { id: "B0CRDQZXKL", title: "Microsoft Surface Laptop 5 13.5\" Touch Intel i7 16GB 512GB", basePrice: 1499.99, category: "laptop", seller: "Microsoft Store", imageUrl: "https://m.media-amazon.com/images/I/laptop-surface.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },

  // 手机类
  { id: "B0CHX1W1XY", title: "Samsung Galaxy S24 Ultra 5G 256GB Titanium Black Unlocked", basePrice: 1299.99, category: "phone", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/phone-s24ultra.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CHXDMHZ4", title: "Apple iPhone 15 Pro 256GB Blue Titanium Unlocked", basePrice: 1099.00, category: "phone", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/phone-iphone15pro.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CGTNR5VQ", title: "Google Pixel 8 Pro 256GB Bay Blue 5G Unlocked", basePrice: 899.00, category: "phone", seller: "Google Store", imageUrl: "https://m.media-amazon.com/images/I/phone-pixel8pro.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CLZW1KD8", title: "Motorola Edge 2024 5G 256GB Eclipse Black Unlocked", basePrice: 599.99, category: "phone", seller: "Motorola Official", imageUrl: "https://m.media-amazon.com/images/I/phone-moto.jpg", currency: "USD", shippingBase: 0, stockStatus: "limited" },
  { id: "B0CJXQKV7Y", title: "OnePlus 12 5G Dual SIM 256GB Silky Black Global Version", basePrice: 799.99, category: "phone", seller: "OnePlus Store", imageUrl: "https://m.media-amazon.com/images/I/phone-oneplus12.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },

  // 耳机类
  { id: "B0CMDGMQBY", title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones Black", basePrice: 398.00, category: "headphones", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/headphones-sony1000.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CHWRXH8B", title: "Apple AirPods Pro 2nd Generation with MagSafe Case USB-C", basePrice: 249.00, category: "headphones", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/headphones-airpodspro.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CCZ26B5V", title: "Bose QuietComfort Ultra Headphones Wireless Noise Cancelling", basePrice: 429.00, category: "headphones", seller: "Bose Official", imageUrl: "https://m.media-amazon.com/images/I/headphones-boseqc.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0BZZ8JQD6", title: "Sennheiser Momentum 4 Wireless Headphones 60H Battery Life", basePrice: 379.95, category: "headphones", seller: "Sennheiser Store", imageUrl: "https://m.media-amazon.com/images/I/headphones-senn4.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0BWXDMJF1", title: "Beats Studio Pro Wireless Bluetooth Noise Cancelling Headphones", basePrice: 349.95, category: "headphones", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/headphones-beats.jpg", currency: "USD", shippingBase: 0, stockStatus: "limited" },

  // 相机类
  { id: "B0BZYZF8WW", title: "Canon EOS R6 Mark II Mirrorless Camera Body", basePrice: 2499.00, category: "camera", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/camera-canonr6.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B09JZT6YK5", title: "Sony Alpha a7 IV Full-Frame Mirrorless Camera Body", basePrice: 2498.00, category: "camera", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/camera-sonya7iv.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0BZQZ3V4Y", title: "Nikon Z8 Mirrorless Camera Body 45.7MP 8K Video", basePrice: 3996.95, category: "camera", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/camera-nikonz8.jpg", currency: "USD", shippingBase: 0, stockStatus: "limited" },
  { id: "B0BW8C5KWZ", title: "Fujifilm X-T5 Mirrorless Camera Body 40.2MP Black", basePrice: 1699.00, category: "camera", seller: "Fujifilm Store", imageUrl: "https://m.media-amazon.com/images/I/camera-fujixt5.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },

  // 智能手表类
  { id: "B0CHX9CY7W", title: "Apple Watch Series 9 GPS 45mm Midnight Aluminum Case Sport Band", basePrice: 429.00, category: "watch", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/watch-aw9.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CCVWNM8Y", title: "Samsung Galaxy Watch 6 Classic 47mm Bluetooth Black", basePrice: 399.99, category: "watch", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/watch-gw6.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0BWVQHZ6F", title: "Garmin Fenix 7X Sapphire Solar GPS Smartwatch 51mm", basePrice: 899.99, category: "watch", seller: "Garmin", imageUrl: "https://m.media-amazon.com/images/I/watch-fenix7x.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0CSVMVYFY", title: "Fitbit Sense 2 Advanced Health Smartwatch Shadow Grey", basePrice: 249.95, category: "watch", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/watch-sense2.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },

  // 平板电脑类
  { id: "B0BJLF2BRM", title: "Apple iPad Pro 12.9-inch M2 Chip 128GB WiFi Space Gray", basePrice: 1099.00, category: "tablet", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/tablet-ipadpro.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
  { id: "B0C1SLD1VK", title: "Samsung Galaxy Tab S9 Ultra 14.6\" 256GB WiFi Graphite", basePrice: 1199.99, category: "tablet", seller: "Amazon.com", imageUrl: "https://m.media-amazon.com/images/I/tablet-tabs9.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
];

/**
 * Etsy 风格的 Mock 商品数据（手工艺品为主）
 */
export const MOCK_ETSY_PRODUCTS: MockProduct[] = [
  // 手工珠宝类
  { id: "etsy-1234567890", title: "Handmade Sterling Silver Moonstone Ring Boho Style Size 7", basePrice: 68.50, category: "jewelry", seller: "MoonlightCreations", imageUrl: "https://i.etsystatic.com/images/jewelry-ring1.jpg", currency: "USD", shippingBase: 4.99, stockStatus: "in_stock" },
  { id: "etsy-1234567891", title: "14K Gold Filled Dainty Necklace with Natural Pearl Pendant", basePrice: 45.00, category: "jewelry", seller: "GoldenThreadJewelry", imageUrl: "https://i.etsystatic.com/images/jewelry-necklace1.jpg", currency: "USD", shippingBase: 3.50, stockStatus: "in_stock" },
  { id: "etsy-1234567892", title: "Vintage Style Copper Wire Wrapped Amethyst Crystal Earrings", basePrice: 32.99, category: "jewelry", seller: "CrystalDreamsArt", imageUrl: "https://i.etsystatic.com/images/jewelry-earrings1.jpg", currency: "USD", shippingBase: 2.99, stockStatus: "limited" },
  { id: "etsy-1234567893", title: "Personalized Name Bracelet Rose Gold Plated Custom Engraved", basePrice: 52.00, category: "jewelry", seller: "PersonalTouchGifts", imageUrl: "https://i.etsystatic.com/images/jewelry-bracelet1.jpg", currency: "USD", shippingBase: 4.50, stockStatus: "in_stock" },
  { id: "etsy-1234567894", title: "Bohemian Turquoise Stone Layered Necklace Set of 3", basePrice: 38.99, category: "jewelry", seller: "BohoChicAccessories", imageUrl: "https://i.etsystatic.com/images/jewelry-layered.jpg", currency: "USD", shippingBase: 3.99, stockStatus: "in_stock" },
  
  // 家居装饰类
  { id: "etsy-1234567895", title: "Macrame Wall Hanging Large Boho Woven Tapestry 36x24 inches", basePrice: 89.99, category: "home_decor", seller: "FiberArtStudio", imageUrl: "https://i.etsystatic.com/images/decor-macrame1.jpg", currency: "USD", shippingBase: 12.99, stockStatus: "in_stock" },
  { id: "etsy-1234567896", title: "Ceramic Planter Set of 3 Modern Minimalist White with Drainage", basePrice: 54.50, category: "home_decor", seller: "ClayAndGlaze", imageUrl: "https://i.etsystatic.com/images/decor-planter1.jpg", currency: "USD", shippingBase: 8.99, stockStatus: "in_stock" },
  { id: "etsy-1234567897", title: "Wooden Floating Shelves Rustic Farmhouse Set of 2 24 inch", basePrice: 76.00, category: "home_decor", seller: "RusticWoodworks", imageUrl: "https://i.etsystatic.com/images/decor-shelves1.jpg", currency: "USD", shippingBase: 15.99, stockStatus: "in_stock" },
  { id: "etsy-1234567898", title: "Hand Painted Watercolor Art Print Abstract Landscape 16x20", basePrice: 42.00, category: "home_decor", seller: "ArtisticImpressions", imageUrl: "https://i.etsystatic.com/images/decor-art1.jpg", currency: "USD", shippingBase: 6.99, stockStatus: "in_stock" },
  { id: "etsy-1234567899", title: "Scented Soy Candle Set Lavender Vanilla 8oz Glass Jar 3 Pack", basePrice: 36.99, category: "home_decor", seller: "CandlelightCo", imageUrl: "https://i.etsystatic.com/images/decor-candles1.jpg", currency: "USD", shippingBase: 7.50, stockStatus: "in_stock" },
  
  // 服装配饰类
  { id: "etsy-1234567900", title: "Hand Knitted Chunky Wool Blanket Throw 50x60 Merino Wool", basePrice: 128.00, category: "textiles", seller: "CozyKnitStudio", imageUrl: "https://i.etsystatic.com/images/textile-blanket1.jpg", currency: "USD", shippingBase: 9.99, stockStatus: "in_stock" },
  { id: "etsy-1234567901", title: "Leather Crossbody Bag Handmade Brown Vintage Style Purse", basePrice: 95.50, category: "bags", seller: "LeatherCraftsman", imageUrl: "https://i.etsystatic.com/images/bag-leather1.jpg", currency: "USD", shippingBase: 8.50, stockStatus: "limited" },
  { id: "etsy-1234567902", title: "Silk Scarf Hand Painted Floral Design 72x18 inches", basePrice: 58.00, category: "accessories", seller: "SilkArtistry", imageUrl: "https://i.etsystatic.com/images/scarf-silk1.jpg", currency: "USD", shippingBase: 4.99, stockStatus: "in_stock" },
  { id: "etsy-1234567903", title: "Crochet Baby Blanket Soft Cotton Pastel Rainbow Colors", basePrice: 48.99, category: "textiles", seller: "BabyDreamsCrochet", imageUrl: "https://i.etsystatic.com/images/textile-baby1.jpg", currency: "USD", shippingBase: 5.99, stockStatus: "in_stock" },
  
  // 文具纸品类
  { id: "etsy-1234567904", title: "Personalized Leather Journal Notebook Custom Engraved A5 Size", basePrice: 42.50, category: "stationery", seller: "PaperAndPenCo", imageUrl: "https://i.etsystatic.com/images/journal-leather1.jpg", currency: "USD", shippingBase: 5.50, stockStatus: "in_stock" },
  { id: "etsy-1234567905", title: "Watercolor Wedding Invitation Suite Set of 50 Custom Printed", basePrice: 185.00, category: "stationery", seller: "ElegantInvites", imageUrl: "https://i.etsystatic.com/images/invite-wedding1.jpg", currency: "USD", shippingBase: 8.99, stockStatus: "in_stock" },
  { id: "etsy-1234567906", title: "Hand Lettered Calligraphy Art Print Motivational Quote 11x14", basePrice: 28.00, category: "stationery", seller: "ModernCalligraphy", imageUrl: "https://i.etsystatic.com/images/print-quote1.jpg", currency: "USD", shippingBase: 4.50, stockStatus: "in_stock" },
  { id: "etsy-1234567907", title: "Washi Tape Set Japanese Decorative Masking Tape 20 Rolls", basePrice: 24.99, category: "stationery", seller: "CraftSuppliesHub", imageUrl: "https://i.etsystatic.com/images/washi-set1.jpg", currency: "USD", shippingBase: 3.99, stockStatus: "in_stock" },
  
  // 玩具游戏类
  { id: "etsy-1234567908", title: "Wooden Montessori Toy Rainbow Stacker Educational Baby Toy", basePrice: 38.50, category: "toys", seller: "WoodenWondersToys", imageUrl: "https://i.etsystatic.com/images/toy-rainbow1.jpg", currency: "USD", shippingBase: 6.99, stockStatus: "in_stock" },
  { id: "etsy-1234567909", title: "Handmade Rag Doll Soft Cloth Doll 18 inch Heirloom Quality", basePrice: 68.00, category: "toys", seller: "DollMakerStudio", imageUrl: "https://i.etsystatic.com/images/toy-doll1.jpg", currency: "USD", shippingBase: 7.50, stockStatus: "limited" },
  { id: "etsy-1234567910", title: "Custom Pet Portrait Digital Art from Photo Dog Cat Painting", basePrice: 45.00, category: "art", seller: "PetPortraitArtist", imageUrl: "https://i.etsystatic.com/images/art-pet1.jpg", currency: "USD", shippingBase: 0, stockStatus: "in_stock" },
];

/**
 * 生成带有价格波动的商品数据
 * @param product 基础商品数据
 * @returns 带有随机价格波动的商品数据
 */
export function generatePriceVariation(product: MockProduct): MockProduct {
  // 价格波动范围：-5% 到 +5%
  const variation = (Math.random() - 0.5) * 0.1;
  const newPrice = product.basePrice * (1 + variation);
  
  // 运费也有小幅波动
  const shippingVariation = Math.random() > 0.7 ? Math.random() * 2 : 0;
  const newShipping = product.shippingBase + shippingVariation;
  
  // 10% 概率改变库存状态
  let stockStatus = product.stockStatus;
  if (Math.random() < 0.1) {
    const statuses: Array<"in_stock" | "limited" | "out_of_stock"> = ["in_stock", "limited", "out_of_stock"];
    stockStatus = statuses[Math.floor(Math.random() * statuses.length)];
  }
  
  return {
    ...product,
    basePrice: Math.round(newPrice * 100) / 100,
    shippingBase: Math.round(newShipping * 100) / 100,
    stockStatus,
  };
}

/**
 * 根据关键词搜索商品
 * @param products 商品列表
 * @param keyword 搜索关键词
 * @param limit 返回数量限制
 * @returns 匹配的商品列表
 */
export function searchProducts(
  products: MockProduct[],
  keyword: string,
  limit: number = 20
): MockProduct[] {
  const lowerKeyword = keyword.toLowerCase();
  
  // 简单的关键词匹配
  const matched = products.filter((product) => {
    return (
      product.title.toLowerCase().includes(lowerKeyword) ||
      product.category.toLowerCase().includes(lowerKeyword)
    );
  });
  
  // 如果没有匹配结果，返回随机商品
  if (matched.length === 0) {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(limit, products.length));
  }
  
  return matched.slice(0, Math.min(limit, matched.length));
}
