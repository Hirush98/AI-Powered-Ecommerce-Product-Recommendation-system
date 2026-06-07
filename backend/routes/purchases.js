const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All purchase routes require auth
router.use(protect);

// ─── POST /api/purchases ──────────────────────────────────────────────────────
const purchaseValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

router.post('/', purchaseValidation, validate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    const purchase = await Purchase.create({
      userId: req.user.userId,
      productId,
      quantity,
      price: product.price,             // snapshot price at purchase time
      totalAmount: product.price * quantity,
    });

    // Decrement stock
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });

    await purchase.populate('productId', 'name brand category image');

    return res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/purchases — own purchase history ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      Purchase.find({ userId: req.user.userId })
        .populate('productId', 'name brand category image price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments({ userId: req.user.userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: purchases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/purchases/:id/review ─────────────────────────────────────────
const reviewValidation = [
  param('id').isMongoId().withMessage('Invalid purchase ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ max: 1000 }).withMessage('Review max 1000 characters'),
];

router.patch('/:id/review', reviewValidation, validate, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      userId: req.user.userId,    // users can only review their own purchases
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found.' });
    }

    if (purchase.rating) {
      return res.status(400).json({ success: false, message: 'Already reviewed.' });
    }

    purchase.rating = req.body.rating;
    purchase.review = req.body.review || null;
    await purchase.save();

    // Update product average rating
    const stats = await Purchase.aggregate([
      { $match: { productId: purchase.productId, rating: { $ne: null } } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(purchase.productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviews: stats[0].count,
      });
    }

    return res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    console.error('Review error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/purchases/all — Admin only ──────────────────────────────────────
router.get('/all', restrictTo('admin'), async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      Purchase.find()
        .populate('userId', 'firstName lastName email')
        .populate('productId', 'name brand category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: purchases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
