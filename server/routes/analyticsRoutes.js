const express = require('express');
const { getDashboardAnalytics, getAuditLogs } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/analytics-data').get(protect, authorize('Admin', 'HOD'), getDashboardAnalytics);
router.route('/audit-logs').get(protect, authorize('Admin'), getAuditLogs);

module.exports = router;
