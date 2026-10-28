const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser } = require('../controllers/authController');

// Rate limiter to prevent automated brute-force attacks (max 30 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// @route   POST /api/auth/register
// @desc    Register a new citizen
// @access  Public
router.post('/register', authLimiter, registerUser);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post('/login', authLimiter, loginUser);

module.exports = router;

