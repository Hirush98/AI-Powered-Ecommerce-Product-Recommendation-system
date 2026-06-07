const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const UserInteraction = require('../models/UserInteraction');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

// ─── POST /api/interactions ───────────────────────────────────────────────────
const interactionValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('interactionType')
    .isIn(['view', 'like', 'add_to_cart', 'remove_from_cart', 'purchase', 'search'])
    .withMessage('Invalid interaction type'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('metadata.searchQuery')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Search query max 200 characters'),
  body('metadata.timeSpent')
    .optional()
    .isInt({ min: 0 }).withMessage('timeSpent must be a positive number'),
  body('metadata.source')
    .optional()
    .isIn(['homepage', 'search', 'recommendation', 'category', 'direct'])
    .withMessage('Invalid source value'),
];

router.post('/', interactionValidation, validate, async (req, res) => {
  try {
    const { productId, interactionType, metadata } = req.body;

    // Verify product exists
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const interaction = await UserInteraction.create({
      userId: req.user.userId,
      productId,
      interactionType,
      metadata: metadata || {},
    });

    return res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    console.error('Interaction error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/interactions/my — own interaction history ──────────────────────
router.get('/my', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const interactions = await UserInteraction.find({ userId: req.user.userId })
      .populate('productId', 'name brand category image price')
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, data: interactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
