const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcrypt');

const USER_FIELDS = `u.id, u.name, u.email, u.status, r.name AS role, u.created_at, u.updated_at`;
const USER_JOIN   = `FROM users u JOIN roles r ON r.id = u.role_id`;

// ─── Get all users (admin only) ───────────────────────────────────────────────
const getAllUsers = async ({ page = 1, limit = 20, status, role }) => {
  let where = ['1=1'];
  const params = [];

  if (status) { where.push('u.status = ?'); params.push(status); }
  if (role)   { where.push('r.name = ?');   params.push(role); }

  const whereClause = where.join(' AND ');
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total ${USER_JOIN} WHERE ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS} ${USER_JOIN} WHERE ${whereClause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total, page, limit };
};

// ─── Get single user ──────────────────────────────────────────────────────────
const getUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS} ${USER_JOIN} WHERE u.id = ?`,
    [id]
  );
  if (!rows.length) throw new AppError('User not found', 404);
  return rows[0];
};

// ─── Update user (admin only) ─────────────────────────────────────────────────
const updateUser = async (id, { name, status, role }) => {
  const updates = [];
  const params  = [];

  if (name) { updates.push('u.name = ?'); params.push(name); }
  if (status) { updates.push('u.status = ?'); params.push(status); }

  if (role) {
    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roleRows.length) throw new AppError('Invalid role', 400);
    updates.push('u.role_id = ?');
    params.push(roleRows[0].id);
  }

  if (!updates.length) throw new AppError('Nothing to update', 400);

  params.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  return getUserById(id);
};

// ─── Delete user (soft: set inactive) ────────────────────────────────────────
const deleteUser = async (id, requestingUserId) => {
  if (id === requestingUserId) throw new AppError('You cannot delete your own account', 400);
  const user = await getUserById(id);
  await pool.query("UPDATE users SET status = 'inactive' WHERE id = ?", [id]);
  return { message: `User ${user.email} has been deactivated` };
};

// ─── Get own profile ──────────────────────────────────────────────────────────
const getProfile = async (userId) => getUserById(userId);

// ─── Change own password ──────────────────────────────────────────────────────
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!rows.length) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ?, refresh_token = NULL WHERE id = ?', [hash, userId]);
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getProfile, changePassword };
