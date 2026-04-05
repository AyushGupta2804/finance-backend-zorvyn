const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');
const { validate, schemas } = require('../validators');

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.query);
    success(res, data, 'Dashboard summary');
  } catch (err) { next(err); }
};

const getOverview = async (req, res, next) => {
  try {
    const data = await dashboardService.getOverview();
    success(res, data);
  } catch (err) { next(err); }
};

const getCategoryTotals = async (req, res, next) => {
  try {
    const type = ['income', 'expense'].includes(req.query.type) ? req.query.type : undefined;
    const data = await dashboardService.getCategoryTotals(type);
    success(res, data);
  } catch (err) { next(err); }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await dashboardService.getMonthlyTrends(year);
    success(res, data);
  } catch (err) { next(err); }
};

const getWeeklyTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getWeeklyTrends();
    success(res, data);
  } catch (err) { next(err); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const data = await dashboardService.getRecentActivity(limit);
    success(res, data);
  } catch (err) { next(err); }
};

module.exports = {
  getSummary, getOverview, getCategoryTotals,
  getMonthlyTrends, getWeeklyTrends, getRecentActivity,
};
