require('dotenv').config();
const mongoose = require('mongoose');

const User            = require('../models/User');
const Product         = require('../models/Product');
const Purchase        = require('../models/Purchase');
const UserInteraction = require('../models/UserInteraction');
const RefreshToken    = require('../models/RefreshToken');

// ─── Seed Data ────────────────────────────────────────────────────────────────

const users = [
  // ── Admins ──────────────────────────────────────────────────────────────────
  {
    firstName: 'Admin',
    lastName:  'User',
    email:     'admin@store.com',
    password:  'Admin1234',
    role:      'admin',
    age:       30,
    gender:    'prefer_not_to_say',
    location:  'San Francisco, CA',
    interests: ['technology', 'analytics', 'business'],
  },
  // ── Regular Users ────────────────────────────────────────────────────────────
  {
    firstName: 'Sarah',
    lastName:  'Chen',
    email:     'sarah@example.com',
    password:  'Sarah1234',
    role:      'user',
    age:       28,
    gender:    'female',
    location:  'New York, NY',
    interests: ['fitness', 'yoga', 'nutrition', 'wellness'],
  },
  {
    firstName: 'Marcus',
    lastName:  'Johnson',
    email:     'marcus@example.com',
    password:  'Marcus1234',
    role:      'user',
    age:       34,
    gender:    'male',
    location:  'Austin, TX',
    interests: ['gaming', 'technology', 'sci-fi', 'gadgets'],
  },
  {
    firstName: 'Priya',
    lastName:  'Patel',
    email:     'priya@example.com',
    password:  'Priya1234',
    role:      'user',
    age:       26,
    gender:    'female',
    location:  'Chicago, IL',
    interests: ['fashion', 'travel', 'photography', 'art'],
  },
  {
    firstName: 'James',
    lastName:  'Rivera',
    email:     'james@example.com',
    password:  'James1234',
    role:      'user',
    age:       42,
    gender:    'male',
    location:  'Seattle, WA',
    interests: ['cooking', 'outdoor', 'hiking', 'sustainability'],
  },
];

const products = [
  // ── Fitness ──────────────────────────────────────────────────────────────────
  {
    name:        'PowerFlex Resistance Band Set',
    description: 'Professional-grade resistance bands for full-body workouts at home or gym.',
    price:       34.99,
    category:    'Fitness',
    brand:       'PowerFlex',
    stock:       120,
    rating:      4.7,
    reviews:     312,
    tags:        ['resistance bands', 'home workout', 'strength training', 'fitness'],
    features:    ['5 resistance levels', 'Non-slip handles', 'Carry bag included', 'Latex-free'],
  },
  {
    name:        'AeroGlide Smart Jump Rope',
    description: 'Bluetooth jump rope with automatic rep counting and calorie tracking app.',
    price:       49.99,
    category:    'Fitness',
    brand:       'AeroGlide',
    stock:       85,
    rating:      4.5,
    reviews:     198,
    tags:        ['jump rope', 'cardio', 'smart fitness', 'home workout'],
    features:    ['Auto rep counting', 'Bluetooth app sync', 'Adjustable length', 'LCD display'],
  },
  {
    name:        'ZenFlow Yoga Mat Pro',
    description: 'Extra-thick eco-friendly yoga mat with alignment guides and carrying strap.',
    price:       68.00,
    category:    'Fitness',
    brand:       'ZenFlow',
    stock:       200,
    rating:      4.8,
    reviews:     541,
    tags:        ['yoga', 'mat', 'eco-friendly', 'meditation', 'fitness'],
    features:    ['6mm thickness', 'Alignment lines', 'Non-slip surface', 'Natural rubber'],
  },
  {
    name:        'IronCore Adjustable Dumbbell 40kg',
    description: 'Space-saving adjustable dumbbell replacing 15 sets — quick-change dial system.',
    price:       289.00,
    category:    'Fitness',
    brand:       'IronCore',
    stock:       40,
    rating:      4.9,
    reviews:     876,
    tags:        ['dumbbell', 'strength training', 'weight training', 'home gym'],
    features:    ['2.5–40kg range', 'Quick-change dial', '15-in-1 replacement', '2 year warranty'],
  },

  // ── Technology ────────────────────────────────────────────────────────────────
  {
    name:        'NovaBuds Pro Wireless Earbuds',
    description: 'Active noise cancelling earbuds with 36-hour total battery and spatial audio.',
    price:       129.99,
    category:    'Technology',
    brand:       'NovaTech',
    stock:       150,
    rating:      4.6,
    reviews:     723,
    tags:        ['earbuds', 'wireless', 'noise cancelling', 'audio', 'bluetooth'],
    features:    ['ANC', '36hr battery', 'Spatial audio', 'IPX5 waterproof', 'Wireless charging'],
  },
  {
    name:        'PixelView 4K Webcam',
    description: 'Ultra-sharp 4K webcam with AI auto-framing and built-in ring light.',
    price:       159.00,
    category:    'Technology',
    brand:       'PixelView',
    stock:       65,
    rating:      4.4,
    reviews:     284,
    tags:        ['webcam', '4K', 'streaming', 'work from home', 'video call'],
    features:    ['4K 30fps', 'AI auto-framing', 'Built-in ring light', 'Privacy shutter'],
  },
  {
    name:        'SwiftCharge 140W GaN Charger',
    description: 'Compact 4-port GaN charger powering laptop, phone, tablet simultaneously.',
    price:       79.99,
    category:    'Technology',
    brand:       'SwiftCharge',
    stock:       220,
    rating:      4.7,
    reviews:     445,
    tags:        ['charger', 'GaN', 'fast charging', 'USB-C', 'travel'],
    features:    ['140W total output', '4 ports', 'GaN technology', 'Foldable plug'],
  },
  {
    name:        'StreamDeck Mini 6-Key Controller',
    description: 'Customisable 6-key macro pad for streamers, editors and power users.',
    price:       89.99,
    category:    'Technology',
    brand:       'Elgato',
    stock:       78,
    rating:      4.8,
    reviews:     932,
    tags:        ['streaming', 'macro pad', 'content creation', 'productivity', 'gaming'],
    features:    ['6 LCD keys', 'Fully customisable', 'App integrations', 'Compact'],
  },

  // ── Gaming ────────────────────────────────────────────────────────────────────
  {
    name:        'VortexPad Pro Controller',
    description: 'Wireless gaming controller with haptic feedback and 40-hour battery life.',
    price:       69.99,
    category:    'Gaming',
    brand:       'VortexGaming',
    stock:       130,
    rating:      4.5,
    reviews:     612,
    tags:        ['controller', 'wireless', 'gaming', 'haptic', 'PC', 'console'],
    features:    ['Haptic feedback', '40hr battery', 'Gyro aiming', 'USB-C charging'],
  },
  {
    name:        'NightOwl RGB Gaming Mouse',
    description: 'Ultra-lightweight 59g gaming mouse with 25K DPI sensor and 70hr battery.',
    price:       79.99,
    category:    'Gaming',
    brand:       'NightOwl',
    stock:       95,
    rating:      4.7,
    reviews:     489,
    tags:        ['gaming mouse', 'RGB', 'wireless', 'lightweight', 'esports'],
    features:    ['59g weight', '25K DPI', '70hr battery', 'RGB lighting', 'USB-C'],
  },
  {
    name:        'SoundWave 7.1 Gaming Headset',
    description: 'Surround sound gaming headset with noise-cancelling mic and memory foam.',
    price:       99.99,
    category:    'Gaming',
    brand:       'SoundWave',
    stock:       110,
    rating:      4.4,
    reviews:     378,
    tags:        ['headset', 'gaming', '7.1 surround', 'noise cancelling', 'mic'],
    features:    ['7.1 surround', 'Detachable mic', 'Memory foam', 'Cross-platform'],
  },

  // ── Fashion ───────────────────────────────────────────────────────────────────
  {
    name:        'UrbanStride Classic Sneakers',
    description: 'Minimalist everyday sneakers with memory foam insole and vegan leather.',
    price:       95.00,
    category:    'Fashion',
    brand:       'UrbanStride',
    stock:       300,
    rating:      4.6,
    reviews:     820,
    tags:        ['sneakers', 'minimalist', 'vegan', 'casual', 'fashion'],
    features:    ['Memory foam insole', 'Vegan leather', 'Recycled sole', 'Unisex sizing'],
  },
  {
    name:        'LumeWatch Slim Smartwatch',
    description: 'Ultra-slim AMOLED smartwatch with health tracking and 14-day battery.',
    price:       199.00,
    category:    'Fashion',
    brand:       'LumeWatch',
    stock:       55,
    rating:      4.5,
    reviews:     634,
    tags:        ['smartwatch', 'wearable', 'health tracking', 'AMOLED', 'fashion'],
    features:    ['AMOLED display', '14-day battery', 'Sleep tracking', '5ATM waterproof'],
  },
  {
    name:        'PackLight Minimalist Backpack 20L',
    description: 'Sleek 20L backpack with laptop sleeve, hidden pockets and waterproof coating.',
    price:       75.00,
    category:    'Fashion',
    brand:       'PackLight',
    stock:       160,
    rating:      4.7,
    reviews:     290,
    tags:        ['backpack', 'minimalist', 'travel', 'laptop bag', 'waterproof'],
    features:    ['20L capacity', '15" laptop sleeve', 'Hidden pockets', 'Waterproof'],
  },

  // ── Cooking ───────────────────────────────────────────────────────────────────
  {
    name:        'ChefPro Sous Vide Precision Cooker',
    description: 'Wifi-enabled precision cooker with app control for restaurant-quality results.',
    price:       119.00,
    category:    'Cooking',
    brand:       'ChefPro',
    stock:       70,
    rating:      4.8,
    reviews:     467,
    tags:        ['sous vide', 'cooking', 'precision', 'smart kitchen', 'chef'],
    features:    ['Wifi app control', '1200W', '±0.1°C accuracy', 'Quiet motor'],
  },
  {
    name:        'BlendMaster Pro 1200W Blender',
    description: 'High-performance blender with self-cleaning mode and 10-speed touch control.',
    price:       149.99,
    category:    'Cooking',
    brand:       'BlendMaster',
    stock:       85,
    rating:      4.6,
    reviews:     352,
    tags:        ['blender', 'smoothie', 'kitchen', 'high performance', 'cooking'],
    features:    ['1200W motor', 'Self-cleaning', '10-speed touch', '64oz BPA-free jar'],
  },
  {
    name:        'SpiceVault Magnetic Spice Rack',
    description: 'Wall-mounted magnetic spice rack holding 24 jars — saves counter space.',
    price:       44.99,
    category:    'Cooking',
    brand:       'SpiceVault',
    stock:       200,
    rating:      4.5,
    reviews:     183,
    tags:        ['spice rack', 'kitchen organisation', 'magnetic', 'wall mount', 'cooking'],
    features:    ['Holds 24 jars', 'Strong magnets', 'Includes labels', 'Easy install'],
  },

  // ── Outdoor ───────────────────────────────────────────────────────────────────
  {
    name:        'TrailBlazer 3-Season Tent 2P',
    description: 'Ultralight 2-person backpacking tent with fast pitch and weather protection.',
    price:       249.00,
    category:    'Outdoor',
    brand:       'TrailBlazer',
    stock:       45,
    rating:      4.8,
    reviews:     298,
    tags:        ['tent', 'camping', 'ultralight', 'backpacking', 'outdoor'],
    features:    ['1.8kg total weight', '10-min setup', '3000mm waterproofing', 'Gear loft'],
  },
  {
    name:        'SolarStep Hiking Pole Set',
    description: 'Collapsible carbon fibre trekking poles with cork grips and auto-lock system.',
    price:       89.00,
    category:    'Outdoor',
    brand:       'SolarStep',
    stock:       120,
    rating:      4.6,
    reviews:     214,
    tags:        ['hiking poles', 'trekking', 'carbon fibre', 'outdoor', 'hiking'],
    features:    ['Carbon fibre', 'Cork grips', 'Auto-lock', 'Collapsible to 38cm'],
  },
  {
    name:        'PureFlow Water Filter Bottle',
    description: 'Self-filtering 650ml bottle removes 99.99% of bacteria — no disposables.',
    price:       39.99,
    category:    'Outdoor',
    brand:       'PureFlow',
    stock:       175,
    rating:      4.7,
    reviews:     531,
    tags:        ['water filter', 'hydration', 'outdoor', 'hiking', 'sustainability'],
    features:    ['4-stage filter', '650ml', 'BPA-free', '1000L filter life'],
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // ── Clear existing data ────────────────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Purchase.deleteMany({}),
      UserInteraction.deleteMany({}),
      RefreshToken.deleteMany({}),
    ]);
    console.log('✅ Cleared\n');

    // ── Seed users ─────────────────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const createdUsers = await User.create(users);
    console.log(`✅ ${createdUsers.length} users created`);

    const adminUser  = createdUsers[0];
    const sarahUser  = createdUsers[1];
    const marcusUser = createdUsers[2];
    const priyaUser  = createdUsers[3];
    const jamesUser  = createdUsers[4];

    // ── Seed products ──────────────────────────────────────────────────────────
    console.log('📦 Seeding products...');
    const createdProducts = await Product.create(products);
    console.log(`✅ ${createdProducts.length} products created`);

    // Map by name for easy reference
    const p = {};
    createdProducts.forEach((prod) => { p[prod.name] = prod; });

    // ── Seed purchases ─────────────────────────────────────────────────────────
    console.log('🛒 Seeding purchases...');

    const purchaseData = [
      // Sarah — fitness focused
      {
        userId:      sarahUser._id,
        productId:   p['ZenFlow Yoga Mat Pro']._id,
        quantity:    1,
        price:       p['ZenFlow Yoga Mat Pro'].price,
        totalAmount: p['ZenFlow Yoga Mat Pro'].price,
        status:      'delivered',
        rating:      5,
        review:      'Best yoga mat I have ever used. The alignment lines are a game changer.',
      },
      {
        userId:      sarahUser._id,
        productId:   p['PowerFlex Resistance Band Set']._id,
        quantity:    1,
        price:       p['PowerFlex Resistance Band Set'].price,
        totalAmount: p['PowerFlex Resistance Band Set'].price,
        status:      'delivered',
        rating:      4,
        review:      'Great quality, the latex-free material is a huge plus for me.',
      },
      // Marcus — gaming + tech focused
      {
        userId:      marcusUser._id,
        productId:   p['NovaBuds Pro Wireless Earbuds']._id,
        quantity:    1,
        price:       p['NovaBuds Pro Wireless Earbuds'].price,
        totalAmount: p['NovaBuds Pro Wireless Earbuds'].price,
        status:      'delivered',
        rating:      5,
        review:      'The noise cancelling is incredible. Worth every penny.',
      },
      {
        userId:      marcusUser._id,
        productId:   p['VortexPad Pro Controller']._id,
        quantity:    1,
        price:       p['VortexPad Pro Controller'].price,
        totalAmount: p['VortexPad Pro Controller'].price,
        status:      'delivered',
        rating:      5,
        review:      'Haptic feedback feels premium. Battery life is outstanding.',
      },
      {
        userId:      marcusUser._id,
        productId:   p['NightOwl RGB Gaming Mouse']._id,
        quantity:    1,
        price:       p['NightOwl RGB Gaming Mouse'].price,
        totalAmount: p['NightOwl RGB Gaming Mouse'].price,
        status:      'shipped',
      },
      // Priya — fashion + travel
      {
        userId:      priyaUser._id,
        productId:   p['UrbanStride Classic Sneakers']._id,
        quantity:    1,
        price:       p['UrbanStride Classic Sneakers'].price,
        totalAmount: p['UrbanStride Classic Sneakers'].price,
        status:      'delivered',
        rating:      4,
        review:      'Stylish and comfortable. The vegan leather looks premium.',
      },
      {
        userId:      priyaUser._id,
        productId:   p['PackLight Minimalist Backpack 20L']._id,
        quantity:    1,
        price:       p['PackLight Minimalist Backpack 20L'].price,
        totalAmount: p['PackLight Minimalist Backpack 20L'].price,
        status:      'delivered',
        rating:      5,
        review:      'Perfect travel backpack — fits under the seat and looks great.',
      },
      // James — cooking + outdoor
      {
        userId:      jamesUser._id,
        productId:   p['ChefPro Sous Vide Precision Cooker']._id,
        quantity:    1,
        price:       p['ChefPro Sous Vide Precision Cooker'].price,
        totalAmount: p['ChefPro Sous Vide Precision Cooker'].price,
        status:      'delivered',
        rating:      5,
        review:      'Transformed the way I cook. The app is intuitive and the results are perfect.',
      },
      {
        userId:      jamesUser._id,
        productId:   p['TrailBlazer 3-Season Tent 2P']._id,
        quantity:    1,
        price:       p['TrailBlazer 3-Season Tent 2P'].price,
        totalAmount: p['TrailBlazer 3-Season Tent 2P'].price,
        status:      'delivered',
        rating:      5,
        review:      'Survived a heavy storm on the PCT. Absolutely solid tent.',
      },
      {
        userId:      jamesUser._id,
        productId:   p['PureFlow Water Filter Bottle']._id,
        quantity:    2,
        price:       p['PureFlow Water Filter Bottle'].price,
        totalAmount: p['PureFlow Water Filter Bottle'].price * 2,
        status:      'delivered',
        rating:      4,
        review:      'Bought two — one for me and one for my hiking partner. Great product.',
      },
    ];

    await Purchase.create(purchaseData);
    console.log(`✅ ${purchaseData.length} purchases created`);

    // ── Seed interactions ──────────────────────────────────────────────────────
    console.log('💬 Seeding interactions...');

    const interactionData = [
      // Sarah browsing fitness
      { userId: sarahUser._id, productId: p['AeroGlide Smart Jump Rope']._id,       interactionType: 'view',         metadata: { source: 'homepage',        timeSpent: 45  } },
      { userId: sarahUser._id, productId: p['AeroGlide Smart Jump Rope']._id,       interactionType: 'like',         metadata: { source: 'homepage'                        } },
      { userId: sarahUser._id, productId: p['IronCore Adjustable Dumbbell 40kg']._id, interactionType: 'view',       metadata: { source: 'category',        timeSpent: 120 } },
      { userId: sarahUser._id, productId: p['IronCore Adjustable Dumbbell 40kg']._id, interactionType: 'add_to_cart', metadata: { source: 'category'                       } },
      { userId: sarahUser._id, productId: p['LumeWatch Slim Smartwatch']._id,        interactionType: 'view',        metadata: { source: 'recommendation',  timeSpent: 60  } },
      // Marcus browsing gaming + tech
      { userId: marcusUser._id, productId: p['SoundWave 7.1 Gaming Headset']._id,   interactionType: 'view',         metadata: { source: 'search',          timeSpent: 90  } },
      { userId: marcusUser._id, productId: p['SoundWave 7.1 Gaming Headset']._id,   interactionType: 'like',         metadata: { source: 'search'                          } },
      { userId: marcusUser._id, productId: p['StreamDeck Mini 6-Key Controller']._id, interactionType: 'view',       metadata: { source: 'recommendation',  timeSpent: 75  } },
      { userId: marcusUser._id, productId: p['StreamDeck Mini 6-Key Controller']._id, interactionType: 'add_to_cart', metadata: { source: 'recommendation'                 } },
      { userId: marcusUser._id, productId: p['PixelView 4K Webcam']._id,             interactionType: 'view',        metadata: { source: 'category',        timeSpent: 55  } },
      { userId: marcusUser._id, productId: p['SwiftCharge 140W GaN Charger']._id,    interactionType: 'search',      metadata: { searchQuery: 'fast charger USB-C'         } },
      // Priya browsing fashion
      { userId: priyaUser._id, productId: p['LumeWatch Slim Smartwatch']._id,        interactionType: 'view',        metadata: { source: 'homepage',        timeSpent: 110 } },
      { userId: priyaUser._id, productId: p['LumeWatch Slim Smartwatch']._id,        interactionType: 'like',        metadata: { source: 'homepage'                        } },
      { userId: priyaUser._id, productId: p['UrbanStride Classic Sneakers']._id,     interactionType: 'view',        metadata: { source: 'search',          timeSpent: 80  } },
      { userId: priyaUser._id, productId: p['PixelView 4K Webcam']._id,              interactionType: 'search',      metadata: { searchQuery: 'compact camera travel'      } },
      // James browsing outdoor + cooking
      { userId: jamesUser._id, productId: p['SolarStep Hiking Pole Set']._id,        interactionType: 'view',        metadata: { source: 'recommendation',  timeSpent: 95  } },
      { userId: jamesUser._id, productId: p['SolarStep Hiking Pole Set']._id,        interactionType: 'like',        metadata: { source: 'recommendation'                  } },
      { userId: jamesUser._id, productId: p['BlendMaster Pro 1200W Blender']._id,    interactionType: 'view',        metadata: { source: 'category',        timeSpent: 65  } },
      { userId: jamesUser._id, productId: p['SpiceVault Magnetic Spice Rack']._id,   interactionType: 'add_to_cart', metadata: { source: 'search'                          } },
      { userId: jamesUser._id, productId: p['PureFlow Water Filter Bottle']._id,     interactionType: 'search',      metadata: { searchQuery: 'water filter hiking bottle' } },
    ];

    await UserInteraction.create(interactionData);
    console.log(`✅ ${interactionData.length} interactions created\n`);

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log('━'.repeat(50));
    console.log('🌱 Seed complete!\n');
    console.log('Test accounts:');
    console.log('  👑 Admin  →  admin@store.com   /  Admin1234');
    console.log('  👤 User 1 →  sarah@example.com /  Sarah1234');
    console.log('  👤 User 2 →  marcus@example.com / Marcus1234');
    console.log('  👤 User 3 →  priya@example.com /  Priya1234');
    console.log('  👤 User 4 →  james@example.com /  James1234');
    console.log('━'.repeat(50));
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

seed();
