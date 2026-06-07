const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const Product = require('../models/Product');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array'),
];

// ─── GET /api/products ────────────────────────────────────────────────────────
// Public — list products with filter + pagination
router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand)    filter.brand = req.query.brand;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Text search
    let sortOption = { createdAt: -1 };
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
      sortOption = { score: { $meta: 'textScore' } };
    }

    if (req.query.sort === 'price_asc')  sortOption = { price: 1 };
    if (req.query.sort === 'price_desc') sortOption = { price: -1 };
    if (req.query.sort === 'rating')     sortOption = { rating: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List products error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/products/categories ────────────────────────────────────────────
// Public — distinct category list
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    return res.status(200).json({ success: true, data: categories.sort() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
// Public — single product
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid product ID')],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, isActive: true });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      return res.status(200).json({ success: true, data: product });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// ─── POST /api/products — Admin only ─────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), productValidation, validate, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/products/:id — Admin only ────────────────────────────────────
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  [param('id').isMongoId().withMessage('Invalid product ID')],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      return res.status(200).json({ success: true, data: product });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// ─── DELETE /api/products/:id — Admin only (soft delete) ─────────────────────
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  [param('id').isMongoId().withMessage('Invalid product ID')],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      return res.status(200).json({ success: true, message: 'Product removed.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

module.exports = router;
