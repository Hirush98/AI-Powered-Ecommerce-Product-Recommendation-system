const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { Product, Customer, Purchase, UserInteraction } = require('./models/schemas');
const RecommendationService = require('./services/recommendationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize recommendation service
const recommendationService = new RecommendationService(process.env.GEMINI_API_KEY);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes

// Get all products with pagination and filtering
app.get('/api/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      brand, 
      minPrice, 
      maxPrice, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { stock: { $gt: 0 } };
    
    // Apply filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer purchase history
app.get('/api/customers/:id/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find({ customerId: req.params.id })
      .populate('productId')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer interactions
app.get('/api/customers/:id/interactions', async (req, res) => {
  try {
    const interactions = await UserInteraction.find({ customerId: req.params.id })
      .populate('productId')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get personalized recommendations for a customer
app.get('/api/customers/:id/recommendations', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await recommendationService.getRecommendations(
      req.params.id, 
      parseInt(limit)
    );
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get homepage recommendations (can be personalized if customer ID provided)
app.get('/api/homepage', async (req, res) => {
  try {
    const { customerId } = req.query;
    const recommendations = await recommendationService.getHomepageRecommendations(customerId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending products
app.get('/api/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const trending = await recommendationService.getTrendingProducts(parseInt(limit));
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track user interaction
app.post('/api/interactions', async (req, res) => {
  try {
    const { customerId, productId, interactionType, metadata } = req.body;
    
    const interaction = new UserInteraction({
      customerId,
      productId,
      interactionType,
      metadata
    });
    
    await interaction.save();
    res.status(201).json(interaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new purchase
app.post('/api/purchases', async (req, res) => {
  try {
    const { customerId, productId, quantity } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    const purchase = new Purchase({
      customerId,
      productId,
      quantity,
      price: product.price,
      totalAmount: product.price * quantity
    });
    
    await purchase.save();
    
    // Update product stock
    product.stock -= quantity;
    await product.save();
    
    // Track purchase interaction
    const interaction = new UserInteraction({
      customerId,
      productId,
      interactionType: 'purchase'
    });
    await interaction.save();
    
    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product brands
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ],
      stock: { $gt: 0 }
    })
    .limit(parseInt(limit))
    .sort({ rating: -1 });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    const totalRevenue = await Purchase.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const topCategories = await Purchase.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSales: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);
    
    const customersWithPurchases = await Purchase.distinct('customerId');
    const customersWithoutPurchases = totalCustomers - customersWithPurchases.length;
    
    res.json({
      totalProducts,
      totalCustomers,
      totalPurchases,
      totalRevenue: totalRevenue[0]?.total || 0,
      customersWithPurchases: customersWithPurchases.length,
      customersWithoutPurchases,
      topCategories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongoConnection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 E-commerce Recommendation Server running on port ${PORT}

🌐 Frontend available at: http://localhost:${PORT}
📡 API Base URL: http://localhost:${PORT}/api

Available endpoints:
- GET  /api/products - Get all products with filtering
- GET  /api/products/:id - Get single product
- GET  /api/customers - Get all customers  
- GET  /api/customers/:id - Get customer by ID
- GET  /api/customers/:id/purchases - Get customer purchase history
- GET  /api/customers/:id/recommendations - Get AI-powered recommendations
- GET  /api/homepage - Get homepage recommendations (with optional customerId)
- GET  /api/trending - Get trending products
- GET  /api/categories - Get product categories
- GET  /api/brands - Get product brands
- GET  /api/search?q=query - Search products
- GET  /api/analytics - Get analytics data
- POST /api/purchases - Create new purchase
- POST /api/interactions - Track user interactions

🤖 AI-powered recommendations using Gemini Flash API
📊 Complete ecommerce data with 100 products, 12 customers, and purchase history
  `);
});

module.exports = app;
