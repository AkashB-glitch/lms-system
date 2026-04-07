const express = require('express');
const { markAttendance, getStudentAnalytics, getSubjects, seedSubjects, requestDispute, getPendingDisputes, resolveDispute } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.route('/seed').post(seedSubjects);
router.route('/subjects').get(protect, getSubjects);
router.post('/mark', protect, authorize('Faculty', 'Admin'), markAttendance);
router.route('/student/:id?').get(protect, getStudentAnalytics);

router.route('/disputes/pending').get(protect, authorize('Faculty', 'Admin'), getPendingDisputes);
router.post('/dispute/:id', protect, authorize('Student'), requestDispute);
router.post('/dispute/:id/resolve', protect, authorize('Faculty', 'Admin'), resolveDispute);

// Demo route to bypass role restrictions
router.post('/inject-demo', protect, async (req, res) => {
  const Attendance = require('../models/Attendance');
  try {
     const d = new Date(); d.setDate(d.getDate() - 1); // yesterday
     await Attendance.create({ studentId: req.user._id, date: d, status: 'ABSENT' });
     res.json({ message: "Success" });
  } catch (err) {
     res.status(500).json({ message: err.message });
  }
});

module.exports = router;
