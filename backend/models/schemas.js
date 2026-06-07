const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  image: { type: String },
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  tags: [String],
  features: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Customer Schema
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  location: { type: String },
  interests: [String], // Categories they're interested in
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Purchase Schema
const purchaseSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String }
});

// User Interaction Schema (for tracking user behavior)
const userInteractionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  interactionType: { 
    type: String, 
    enum: ['view', 'like', 'add_to_cart', 'purchase', 'search'], 
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Object } // Additional data like search terms, time spent, etc.
});

const Product = mongoose.model('Product', productSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

module.exports = {
  Product,
  Customer,
  Purchase,
  UserInteraction
};
