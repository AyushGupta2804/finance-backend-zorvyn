const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async ({ name, email, password, role }) => {
  const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUsers.length) throw new AppError('Email already registered', 409);

  const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
  if (!roleRows.length) throw new AppError('Invalid role', 400);

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, roleRows[0].id]
  );

  return { id: result.insertId, name, email, role };
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.status, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );

  const user = rows[0];
  if (!user) throw new AppError('Invalid email or password', 401);
  if (user.status === 'inactive') throw new AppError('Account is deactivated. Contact admin.', 403);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Persist refresh token (hashed)
  const refreshHash = await bcrypt.hash(refreshToken, 8);
  await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshHash, user.id]);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshTokens = async (rawRefreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.status, u.refresh_token, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [payload.sub]
  );

  const user = rows[0];
  if (!user || !user.refresh_token) throw new AppError('Refresh token not found', 401);

  const isValid = await bcrypt.compare(rawRefreshToken, user.refresh_token);
  if (!isValid) throw new AppError('Refresh token mismatch', 401);

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshHash  = await bcrypt.hash(refreshToken, 8);
  await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshHash, user.id]);

  return { accessToken, refreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (userId) => {
  await pool.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
};

module.exports = { register, login, refreshTokens, logout };
