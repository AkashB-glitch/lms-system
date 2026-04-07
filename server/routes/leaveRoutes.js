const express = require('express');
const { applyLeave, getMyLeaves, getPendingLeavesForMe, approveLeave, rejectLeave, getAllLeaves } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/apply').post(protect, applyLeave);
router.route('/my').get(protect, getMyLeaves);
router.route('/pending').get(protect, authorize('Faculty', 'HOD', 'Admin'), getPendingLeavesForMe);
router.route('/all').get(protect, authorize('Admin', 'HOD'), getAllLeaves);

router.route('/approve/:id').put(protect, authorize('Faculty', 'HOD', 'Admin'), approveLeave);
router.route('/reject/:id').put(protect, authorize('Faculty', 'HOD', 'Admin'), rejectLeave);

module.exports = router;
