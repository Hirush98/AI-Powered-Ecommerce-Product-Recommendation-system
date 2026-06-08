const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { recommendationLimiter } = require('../middleware/rateLimiter');
const { getRecommendations } = require('../services/recommendationService');

router.use(protect);

/**
 * GET /api/recommendations
 * Returns AI-powered recommendations for the logged-in user.
 * Query params:
 *   ?refresh=true  — force bypass cache and regenerate
 */
router.get('/', recommendationLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const forceRefresh = req.query.refresh === 'true';
    const result = await getRecommendations(user, forceRefresh);

    return res.status(200).json({
      success: true,
      cached:   result.cached,
      fallback: result.fallback,
      count:    result.recommendations.length,
      data:     result.recommendations,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate recommendations.',
    });
  }
});

module.exports = router;
