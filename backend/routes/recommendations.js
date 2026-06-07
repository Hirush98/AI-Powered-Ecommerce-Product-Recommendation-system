const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { recommendationLimiter } = require('../middleware/rateLimiter');

router.use(protect);

// ─── GET /api/recommendations ─────────────────────────────────────────────────
// Rate limited — hits Gemini AI
// Full AI logic wired in Chunk 5 (Redis caching layer)
router.get('/', recommendationLimiter, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Recommendations endpoint ready. AI service wired in Chunk 5.',
      userId: req.user.userId,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
