const { pool } = require('../config/database');

// ─── Overview: total income, expense, net balance ─────────────────────────────
const getOverview = async () => {
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END), 0) AS net_balance
     FROM financial_records
     WHERE deleted_at IS NULL`
  );
  return row;
};

// ─── Category-wise totals ─────────────────────────────────────────────────────
const getCategoryTotals = async (type) => {
  let where = 'r.deleted_at IS NULL';
  const params = [];
  if (type) { where += ' AND r.type = ?'; params.push(type); }

  const [rows] = await pool.query(
    `SELECT c.name AS category, r.type,
            COUNT(*)       AS transaction_count,
            SUM(r.amount)  AS total,
            AVG(r.amount)  AS average
     FROM financial_records r
     JOIN categories c ON c.id = r.category_id
     WHERE ${where}
     GROUP BY c.name, r.type
     ORDER BY total DESC`,
    params
  );
  return rows;
};

// ─── Monthly trends ───────────────────────────────────────────────────────────
const getMonthlyTrends = async (year) => {
  const [rows] = await pool.query(
    `SELECT
       MONTH(record_date) AS month,
       MONTHNAME(record_date) AS month_name,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END), 0) AS net
     FROM financial_records
     WHERE YEAR(record_date) = ? AND deleted_at IS NULL
     GROUP BY MONTH(record_date), MONTHNAME(record_date)
     ORDER BY month ASC`,
    [year]
  );
  return rows;
};

// ─── Weekly trends (last 8 weeks) ────────────────────────────────────────────
const getWeeklyTrends = async () => {
  const [rows] = await pool.query(
    `SELECT
       YEARWEEK(record_date, 1)  AS week_key,
       MIN(record_date)          AS week_start,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM financial_records
     WHERE record_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
       AND deleted_at IS NULL
     GROUP BY YEARWEEK(record_date, 1)
     ORDER BY week_key DESC`
  );
  return rows;
};

// ─── Recent activity (last N records) ────────────────────────────────────────
const getRecentActivity = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.amount, r.type, c.name AS category, r.record_date, r.notes,
            u.name AS created_by
     FROM financial_records r
     JOIN categories c ON c.id = r.category_id
     JOIN users u ON u.id = r.user_id
     WHERE r.deleted_at IS NULL
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

// ─── Full dashboard summary ───────────────────────────────────────────────────
const getSummary = async ({ year }) => {
  const [overview, categoryTotals, monthlyTrends, recentActivity] = await Promise.all([
    getOverview(),
    getCategoryTotals(),
    getMonthlyTrends(year),
    getRecentActivity(10),
  ]);

  return { overview, categoryTotals, monthlyTrends, recentActivity };
};

module.exports = {
  getOverview,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getSummary,
};
