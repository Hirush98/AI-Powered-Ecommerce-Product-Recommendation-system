const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/jwt');

// ─── Validation chains ────────────────────────────────────────────────────────

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name max 50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name max 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('age')
    .optional()
    .isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Public — create new user account
 */
router.post('/register', registerValidation, validate, async (req, res) => {
  try {
    const { firstName, lastName, email, password, age, gender, location, interests } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user — password gets hashed by the pre-save hook in User model
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      age,
      gender,
      location,
      interests: interests || [],
    });

    // Issue tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      accessToken,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
});

/**
 * POST /api/auth/login
 * Public — login with email + password
 */
router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Issue tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      accessToken,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Public — exchange refresh token cookie for new access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.',
      });
    }

    // Validate token from DB
    const tokenDoc = await validateRefreshToken(token);
    const user = tokenDoc.userId; // populated by validateRefreshToken

    // Revoke old refresh token (rotation — one-time use)
    await revokeRefreshToken(token);

    // Issue new pair
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid refresh token.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Protected — revoke current device refresh token
 */
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await revokeRefreshToken(token);
    }

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Protected — revoke all refresh tokens (logout all devices)
 */
router.post('/logout-all', protect, async (req, res) => {
  try {
    await revokeAllUserRefreshTokens(req.user.userId);
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices.',
    });
  } catch (error) {
    console.error('Logout-all error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
});

/**
 * GET /api/auth/me
 * Protected — get current logged-in user profile
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
});

module.exports = router;
