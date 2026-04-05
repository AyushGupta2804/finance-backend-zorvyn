const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { AppError } = require('./errorHandler');

// ─── Authenticate: validate access token ─────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      throw new AppError(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token', 401);
    }

    // Verify user still exists and is active
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.status, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`,
      [payload.sub]
    );

    if (!rows.length || rows[0].status !== 'active') {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Authorize: check role permissions ───────────────────────────────────────
// Usage: authorize('admin') or authorize('admin', 'analyst')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
