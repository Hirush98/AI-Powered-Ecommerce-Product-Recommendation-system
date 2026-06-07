const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All user routes require authentication
router.use(protect);

// ─── GET /api/users/profile ───────────────────────────────────────────────────
// Get own profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: user.toPublicProfile() });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/users/profile ─────────────────────────────────────────────────
// Update own profile
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty().withMessage('First name cannot be empty')
    .isLength({ max: 50 }).withMessage('First name max 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty().withMessage('Last name cannot be empty')
    .isLength({ max: 50 }).withMessage('Last name max 50 characters'),

  body('age')
    .optional()
    .isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location max 100 characters'),

  body('interests')
    .optional()
    .isArray().withMessage('Interests must be an array'),
];

router.patch('/profile', updateProfileValidation, validate, async (req, res) => {
  try {
    // Fields user is allowed to update (prevent role escalation)
    const allowedFields = ['firstName', 'lastName', 'age', 'gender', 'location', 'interests'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated.',
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/users/change-password ────────────────────────────────────────
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

router.patch('/change-password', changePasswordValidation, validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook re-hashes
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin only routes ────────────────────────────────────────────────────────

// GET /api/users — list all users (admin)
router.get('/', restrictTo('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ isActive: true }).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: users.map((u) => u.toPublicProfile()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/users/:id — soft delete user (admin)
router.delete(
  '/:id',
  restrictTo('admin'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      return res.status(200).json({ success: true, message: 'User deactivated.' });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

module.exports = router;
