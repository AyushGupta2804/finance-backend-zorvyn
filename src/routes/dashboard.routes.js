const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

router.use(authenticate);

// Viewer: summary + overview only
router.get('/summary',          validate(schemas.dashboardQuerySchema, 'query'), dashboardController.getSummary);
router.get('/overview',         dashboardController.getOverview);
router.get('/recent-activity',  dashboardController.getRecentActivity);

// Analyst + Admin: advanced analytics
router.get('/categories',       authorize('analyst', 'admin'), dashboardController.getCategoryTotals);
router.get('/trends/monthly',   authorize('analyst', 'admin'), dashboardController.getMonthlyTrends);
router.get('/trends/weekly',    authorize('analyst', 'admin'), dashboardController.getWeeklyTrends);

module.exports = router;
