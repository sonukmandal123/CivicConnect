const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes middleware
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload and attach it to req.user (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next(); // Move to the next middleware or route handler
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token was found
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin role checking middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
