const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// ─── Upsert category helper ───────────────────────────────────────────────────
const getOrCreateCategory = async (conn, name) => {
  const normalised = name.trim();
  const [existing] = await conn.query('SELECT id FROM categories WHERE name = ? FOR UPDATE', [normalised]);
  if (existing.length) return existing[0].id;

  const [result] = await conn.query('INSERT INTO categories (name) VALUES (?)', [normalised]);
  return result.insertId;
};

// ─── Create record ────────────────────────────────────────────────────────────
const createRecord = async (userId, { amount, type, category, record_date, notes }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const categoryId = await getOrCreateCategory(conn, category);
    const [result] = await conn.query(
      'INSERT INTO financial_records (user_id, amount, type, category_id, record_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, amount, type, categoryId, record_date, notes]
    );
    await conn.commit();
    return getRecordById(result.insertId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Get all records (paginated + filtered) ───────────────────────────────────
const getAllRecords = async ({ type, category, start_date, end_date, page, limit, sort_by, order }) => {
  const where  = ['r.deleted_at IS NULL'];
  const params = [];

  if (type)       { where.push('r.type = ?');            params.push(type); }
  if (category)   { where.push('c.name LIKE ?');         params.push(`%${category}%`); }
  if (start_date) { where.push('r.record_date >= ?');    params.push(start_date); }
  if (end_date)   { where.push('r.record_date <= ?');    params.push(end_date); }

  const whereClause = where.join(' AND ');
  const offset = (page - 1) * limit;

  const ALLOWED_SORT  = { record_date: 'r.record_date', amount: 'r.amount', created_at: 'r.created_at' };
  const ALLOWED_ORDER = { asc: 'ASC', desc: 'DESC' };
  const sortCol  = ALLOWED_SORT[sort_by]  || 'r.record_date';
  const orderDir = ALLOWED_ORDER[order]   || 'DESC';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM financial_records r
     JOIN categories c ON c.id = r.category_id
     WHERE ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT r.id, r.amount, r.type, c.name AS category, r.record_date, r.notes,
            r.created_at, r.updated_at,
            u.id AS created_by_id, u.name AS created_by
     FROM financial_records r
     JOIN categories c ON c.id = r.category_id
     JOIN users u ON u.id = r.user_id
     WHERE ${whereClause}
     ORDER BY ${sortCol} ${orderDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total, page, limit };
};

// ─── Get single record ────────────────────────────────────────────────────────
const getRecordById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.amount, r.type, c.name AS category, r.record_date, r.notes,
            r.created_at, r.updated_at,
            u.id AS created_by_id, u.name AS created_by
     FROM financial_records r
     JOIN categories c ON c.id = r.category_id
     JOIN users u ON u.id = r.user_id
     WHERE r.id = ? AND r.deleted_at IS NULL`,
    [id]
  );
  if (!rows.length) throw new AppError('Financial record not found', 404);
  return rows[0];
};

// ─── Update record ────────────────────────────────────────────────────────────
const updateRecord = async (id, { amount, type, category, record_date, notes }) => {
  await getRecordById(id); // ensure exists

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const updates = [];
    const params  = [];

    if (amount      !== undefined) { updates.push('amount = ?');      params.push(amount); }
    if (type        !== undefined) { updates.push('type = ?');        params.push(type); }
    if (record_date !== undefined) { updates.push('record_date = ?'); params.push(record_date); }
    if (notes       !== undefined) { updates.push('notes = ?');       params.push(notes); }

    if (category !== undefined) {
      const catId = await getOrCreateCategory(conn, category);
      updates.push('category_id = ?');
      params.push(catId);
    }

    if (!updates.length) throw new AppError('Nothing to update', 400);
    params.push(id);

    await conn.query(`UPDATE financial_records SET ${updates.join(', ')} WHERE id = ?`, params);
    await conn.commit();
    return getRecordById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Soft delete record ───────────────────────────────────────────────────────
const deleteRecord = async (id) => {
  await getRecordById(id); // ensure exists
  await pool.query('UPDATE financial_records SET deleted_at = NOW() WHERE id = ?', [id]);
  return { message: 'Record deleted successfully' };
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };
