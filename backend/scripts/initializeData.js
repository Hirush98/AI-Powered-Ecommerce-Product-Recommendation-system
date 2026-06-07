const mongoose = require('mongoose');
const { Product, Customer, Purchase, UserInteraction } = require('../models/schemas');

// Sample product data (100 products across different categories)
const sampleProducts = [
  // Electronics - Smartphones
  {
    name: "iPhone 15 Pro",
    description: "Latest Apple smartphone with A17 Pro chip and titanium design",
    price: 999,
    category: "Electronics",
    brand: "Apple",
    image: "iphone15pro.jpg",
    stock: 50,
    rating: 4.8,
    reviews: 1250,
    tags: ["smartphone", "premium", "iOS"],
    features: ["A17 Pro chip", "48MP camera", "Titanium build", "USB-C"]
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Premium Android smartphone with S Pen and AI features",
    price: 1199,
    category: "Electronics",
    brand: "Samsung",
    image: "galaxys24ultra.jpg",
    stock: 45,
    rating: 4.7,
    reviews: 980,
    tags: ["smartphone", "android", "premium"],
    features: ["S Pen", "200MP camera", "AI features", "120Hz display"]
  },
  {
    name: "Google Pixel 8",
    description: "Google's flagship with advanced AI photography",
    price: 699,
    category: "Electronics",
    brand: "Google",
    image: "pixel8.jpg",
    stock: 30,
    rating: 4.6,
    reviews: 750,
    tags: ["smartphone", "photography", "AI"],
    features: ["Magic Eraser", "Night Sight", "Pure Android", "7 years updates"]
  },
  
  // Electronics - Laptops
  {
    name: "MacBook Pro 16-inch M3",
    description: "Powerful laptop for professionals with M3 chip",
    price: 2499,
    category: "Electronics",
    brand: "Apple",
    image: "macbookpro16.jpg",
    stock: 25,
    rating: 4.9,
    reviews: 450,
    tags: ["laptop", "professional", "macOS"],
    features: ["M3 chip", "Liquid Retina XDR display", "22-hour battery", "Studio-quality mics"]
  },
  {
    name: "Dell XPS 13",
    description: "Ultra-thin laptop with premium build quality",
    price: 1299,
    category: "Electronics",
    brand: "Dell",
    image: "xps13.jpg",
    stock: 35,
    rating: 4.5,
    reviews: 680,
    tags: ["laptop", "ultrabook", "windows"],
    features: ["13th Gen Intel", "4K display", "Carbon fiber", "Lightweight"]
  },
  {
    name: "ThinkPad X1 Carbon",
    description: "Business laptop with legendary keyboard",
    price: 1799,
    category: "Electronics",
    brand: "Lenovo",
    image: "thinkpadx1.jpg",
    stock: 20,
    rating: 4.6,
    reviews: 320,
    tags: ["laptop", "business", "durable"],
    features: ["Legendary keyboard", "Military-grade durability", "Rapid Charge", "Privacy features"]
  },

  // Clothing - Men's
  {
    name: "Levi's 501 Original Jeans",
    description: "Classic straight-fit denim jeans",
    price: 89,
    category: "Clothing",
    brand: "Levi's",
    image: "levis501.jpg",
    stock: 100,
    rating: 4.4,
    reviews: 2500,
    tags: ["jeans", "men", "classic"],
    features: ["100% cotton", "Straight fit", "Button fly", "Classic 5-pocket"]
  },
  {
    name: "Nike Air Force 1",
    description: "Iconic basketball-inspired sneakers",
    price: 110,
    category: "Clothing",
    brand: "Nike",
    image: "airforce1.jpg",
    stock: 80,
    rating: 4.7,
    reviews: 3200,
    tags: ["sneakers", "casual", "basketball"],
    features: ["Air cushioning", "Leather upper", "Rubber outsole", "Perforations"]
  },
  {
    name: "Patagonia Down Jacket",
    description: "Lightweight down jacket for outdoor activities",
    price: 229,
    category: "Clothing",
    brand: "Patagonia",
    image: "patagoniadown.jpg",
    stock: 40,
    rating: 4.8,
    reviews: 890,
    tags: ["jacket", "outdoor", "down"],
    features: ["600-fill down", "DWR coating", "Packable", "Recycled materials"]
  },

  // Home & Garden
  {
    name: "Dyson V15 Detect",
    description: "Cordless vacuum with laser dust detection",
    price: 749,
    category: "Home & Garden",
    brand: "Dyson",
    image: "dysonv15.jpg",
    stock: 30,
    rating: 4.6,
    reviews: 1100,
    tags: ["vacuum", "cordless", "technology"],
    features: ["Laser dust detection", "60 minutes runtime", "Advanced filtration", "LCD screen"]
  },
  {
    name: "Instant Pot Duo 7-in-1",
    description: "Multi-functional electric pressure cooker",
    price: 99,
    category: "Home & Garden",
    brand: "Instant Pot",
    image: "instantpot.jpg",
    stock: 60,
    rating: 4.5,
    reviews: 4500,
    tags: ["kitchen", "pressure cooker", "multi-function"],
    features: ["7 functions", "6-quart capacity", "Smart programs", "Stainless steel"]
  },

  // Sports & Outdoors
  {
    name: "Peloton Bike+",
    description: "Connected fitness bike with rotating screen",
    price: 2495,
    category: "Sports & Outdoors",
    brand: "Peloton",
    image: "pelotonbike.jpg",
    stock: 15,
    rating: 4.3,
    reviews: 850,
    tags: ["fitness", "bike", "connected"],
    features: ["Rotating HD touchscreen", "Auto-Follow resistance", "Apple GymKit", "Built-in speakers"]
  },
  {
    name: "YETI Rambler Tumbler",
    description: "Insulated stainless steel tumbler",
    price: 35,
    category: "Sports & Outdoors",
    brand: "YETI",
    image: "yetirambler.jpg",
    stock: 150,
    rating: 4.8,
    reviews: 2800,
    tags: ["drinkware", "insulated", "outdoor"],
    features: ["Double-wall insulation", "No Sweat Design", "Dishwasher safe", "MagSlider Lid"]
  }
];

// Generate more products programmatically
const categories = ["Electronics", "Clothing", "Home & Garden", "Sports & Outdoors", "Books", "Beauty", "Toys", "Automotive"];
const brands = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "LG", "Canon", "HP", "Dell", "Asus"];
const adjectives = ["Premium", "Professional", "Compact", "Lightweight", "Durable", "Innovative", "Smart", "Advanced"];
const productTypes = {
  "Electronics": ["Headphones", "Tablet", "Monitor", "Keyboard", "Mouse", "Speaker", "Camera", "Smartwatch"],
  "Clothing": ["T-Shirt", "Hoodie", "Dress", "Pants", "Shoes", "Hat", "Jacket", "Socks"],
  "Home & Garden": ["Coffee Maker", "Blender", "Lamp", "Pillow", "Curtains", "Plant Pot", "Organizer"],
  "Sports & Outdoors": ["Water Bottle", "Yoga Mat", "Dumbbells", "Backpack", "Tent", "Sleeping Bag"],
  "Books": ["Novel", "Cookbook", "Biography", "Guide", "Manual", "Textbook"],
  "Beauty": ["Moisturizer", "Shampoo", "Lipstick", "Foundation", "Mascara", "Serum"],
  "Toys": ["Action Figure", "Board Game", "Puzzle", "Building Set", "Doll", "Car"],
  "Automotive": ["Car Cover", "Floor Mats", "Phone Mount", "Air Freshener", "Tool Kit"]
};

// Generate additional products to reach 100
for (let i = sampleProducts.length; i < 100; i++) {
  const category = categories[Math.floor(Math.random() * categories.length)];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const type = productTypes[category][Math.floor(Math.random() * productTypes[category].length)];
  
  sampleProducts.push({
    name: `${brand} ${adjective} ${type}`,
    description: `High-quality ${type.toLowerCase()} from ${brand} with premium features`,
    price: Math.floor(Math.random() * 2000) + 50,
    category: category,
    brand: brand,
    image: `${type.toLowerCase()}_${i}.jpg`,
    stock: Math.floor(Math.random() * 100) + 10,
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviews: Math.floor(Math.random() * 1000) + 50,
    tags: [type.toLowerCase(), category.toLowerCase(), "quality"],
    features: ["Premium quality", "Durable design", "User-friendly", "Value for money"]
  });
}

// Sample customer data (12 customers - 10 with purchases, 2 without)
const sampleCustomers = [
  {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    age: 28,
    gender: "male",
    location: "New York, NY",
    interests: ["Electronics", "Sports & Outdoors"]
  },
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    age: 34,
    gender: "female",
    location: "Los Angeles, CA",
    interests: ["Clothing", "Beauty", "Home & Garden"]
  },
  {
    firstName: "Mike",
    lastName: "Davis",
    email: "mike.davis@email.com",
    age: 42,
    gender: "male",
    location: "Chicago, IL",
    interests: ["Electronics", "Automotive", "Books"]
  },
  {
    firstName: "Emily",
    lastName: "Brown",
    email: "emily.brown@email.com",
    age: 26,
    gender: "female",
    location: "Austin, TX",
    interests: ["Clothing", "Sports & Outdoors", "Beauty"]
  },
  {
    firstName: "David",
    lastName: "Wilson",
    email: "david.wilson@email.com",
    age: 31,
    gender: "male",
    location: "Seattle, WA",
    interests: ["Electronics", "Home & Garden", "Books"]
  },
  {
    firstName: "Lisa",
    lastName: "Anderson",
    email: "lisa.anderson@email.com",
    age: 29,
    gender: "female",
    location: "Miami, FL",
    interests: ["Beauty", "Clothing", "Sports & Outdoors"]
  },
  {
    firstName: "Robert",
    lastName: "Taylor",
    email: "robert.taylor@email.com",
    age: 45,
    gender: "male",
    location: "Denver, CO",
    interests: ["Sports & Outdoors", "Automotive", "Electronics"]
  },
  {
    firstName: "Jennifer",
    lastName: "Martinez",
    email: "jennifer.martinez@email.com",
    age: 33,
    gender: "female",
    location: "Phoenix, AZ",
    interests: ["Home & Garden", "Beauty", "Books"]
  },
  {
    firstName: "Chris",
    lastName: "Garcia",
    email: "chris.garcia@email.com",
    age: 27,
    gender: "male",
    location: "Boston, MA",
    interests: ["Electronics", "Sports & Outdoors", "Toys"]
  },
  {
    firstName: "Amanda",
    lastName: "Rodriguez",
    email: "amanda.rodriguez@email.com",
    age: 30,
    gender: "female",
    location: "San Francisco, CA",
    interests: ["Clothing", "Electronics", "Books"]
  },
  // Customers without purchases
  {
    firstName: "Kevin",
    lastName: "Lee",
    email: "kevin.lee@email.com",
    age: 25,
    gender: "male",
    location: "Portland, OR",
    interests: ["Electronics", "Sports & Outdoors", "Books"]
  },
  {
    firstName: "Rachel",
    lastName: "White",
    email: "rachel.white@email.com",
    age: 32,
    gender: "female",
    location: "Nashville, TN",
    interests: ["Beauty", "Clothing", "Home & Garden"]
  }
];

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Purchase.deleteMany({});
    await UserInteraction.deleteMany({});
    
    console.log('Cleared existing data');

    // Insert products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${insertedProducts.length} products`);

    // Insert customers
    const insertedCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`Inserted ${insertedCustomers.length} customers`);

    // Generate purchases for first 10 customers
    const purchases = [];
    const userInteractions = [];
    
    for (let i = 0; i < 10; i++) {
      const customer = insertedCustomers[i];
      const customerInterests = customer.interests;
      
      // Each customer buys 2-5 products
      const numPurchases = Math.floor(Math.random() * 4) + 2;
      
      for (let j = 0; j < numPurchases; j++) {
        // Find products matching customer interests
        const interestedProducts = insertedProducts.filter(product => 
          customerInterests.includes(product.category)
        );
        
        let selectedProduct;
        if (interestedProducts.length > 0) {
          selectedProduct = interestedProducts[Math.floor(Math.random() * interestedProducts.length)];
        } else {
          selectedProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        }
        
        const quantity = Math.floor(Math.random() * 3) + 1;
        const purchase = {
          customerId: customer._id,
          productId: selectedProduct._id,
          quantity: quantity,
          price: selectedProduct.price,
          totalAmount: selectedProduct.price * quantity,
          purchaseDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
          rating: Math.floor(Math.random() * 2) + 4, // Rating between 4-5
          review: Math.random() > 0.7 ? "Great product, highly recommended!" : undefined
        };
        
        purchases.push(purchase);
        
        // Add purchase interaction
        userInteractions.push({
          customerId: customer._id,
          productId: selectedProduct._id,
          interactionType: 'purchase',
          timestamp: purchase.purchaseDate
        });
        
        // Add some view interactions for purchased products
        userInteractions.push({
          customerId: customer._id,
          productId: selectedProduct._id,
          interactionType: 'view',
          timestamp: new Date(purchase.purchaseDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }
      
      // Add some view interactions for products they didn't buy
      const viewCount = Math.floor(Math.random() * 10) + 5;
      for (let k = 0; k < viewCount; k++) {
        const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        userInteractions.push({
          customerId: customer._id,
          productId: randomProduct._id,
          interactionType: 'view',
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    // Add interactions for customers without purchases (browsing behavior)
    for (let i = 10; i < 12; i++) {
      const customer = insertedCustomers[i];
      const customerInterests = customer.interests;
      
      // Add view interactions
      const viewCount = Math.floor(Math.random() * 20) + 10;
      for (let j = 0; j < viewCount; j++) {
        const interestedProducts = insertedProducts.filter(product => 
          customerInterests.includes(product.category)
        );
        
        let selectedProduct;
        if (interestedProducts.length > 0 && Math.random() > 0.3) {
          selectedProduct = interestedProducts[Math.floor(Math.random() * interestedProducts.length)];
        } else {
          selectedProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        }
        
        userInteractions.push({
          customerId: customer._id,
          productId: selectedProduct._id,
          interactionType: 'view',
          timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        });
      }
      
      // Add some add_to_cart interactions (but no purchases)
      const cartCount = Math.floor(Math.random() * 5) + 2;
      for (let j = 0; j < cartCount; j++) {
        const interestedProducts = insertedProducts.filter(product => 
          customerInterests.includes(product.category)
        );
        
        let selectedProduct;
        if (interestedProducts.length > 0) {
          selectedProduct = interestedProducts[Math.floor(Math.random() * interestedProducts.length)];
        } else {
          selectedProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        }
        
        userInteractions.push({
          customerId: customer._id,
          productId: selectedProduct._id,
          interactionType: 'add_to_cart',
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    // Insert purchases and interactions
    if (purchases.length > 0) {
      await Purchase.insertMany(purchases);
      console.log(`Inserted ${purchases.length} purchases`);
    }
    
    if (userInteractions.length > 0) {
      await UserInteraction.insertMany(userInteractions);
      console.log(`Inserted ${userInteractions.length} user interactions`);
    }

    console.log('Database initialization completed successfully!');
    console.log(`
    Summary:
    - ${insertedProducts.length} products across ${categories.length} categories
    - ${insertedCustomers.length} customers (10 with purchases, 2 without)
    - ${purchases.length} total purchases
    - ${userInteractions.length} user interactions recorded
    `);

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

module.exports = { initializeDatabase, sampleProducts, sampleCustomers };

// Run initialization if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  initializeDatabase();
}
