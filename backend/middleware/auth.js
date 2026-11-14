const jwt = require('jsonwebtoken');
const { userRepo } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'supersecret_jwt_key_change_in_production_123456';
    const decoded = jwt.verify(token, secret);

    const user = await userRepo.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// Optional auth middleware: sets req.user if valid token exists, but doesn't block guests
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'supersecret_jwt_key_change_in_production_123456';
    const decoded = jwt.verify(token, secret);
    const user = await userRepo.findById(decoded.id);
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  protect,
  optionalAuth,
};
