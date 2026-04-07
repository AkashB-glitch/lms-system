const Leave = require('../models/Leave');
const AuditLog = require('../models/AuditLog');

const getDashboardAnalytics = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'Approved' }).populate('userId', 'department');
    
    // 1. Monthly Trends
    const monthlyTrends = Array(12).fill(0);
    leaves.forEach(l => {
      const m = new Date(l.startDate).getMonth();
      monthlyTrends[m]++;
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendsData = monthlyTrends.map((val, i) => ({ month: monthNames[i], leaves: val }));

    // 2. Department Distribution
    const deptCount = {};
    leaves.forEach(l => {
      if (l.userId && l.userId.department) {
        deptCount[l.userId.department] = (deptCount[l.userId.department] || 0) + 1;
      }
    });
    const deptData = Object.keys(deptCount).map(k => ({ name: k, value: deptCount[k] }));

    // 3. Peak Leave Periods (by Week)
    const weekCount = {};
    leaves.forEach(l => {
        // approx week 1-52
        const date = new Date(l.startDate);
        const week = Math.ceil(date.getDate() / 7);
        const key = `${monthNames[date.getMonth()]} W${week}`;
        weekCount[key] = (weekCount[key] || 0) + 1;
    });
    const peakData = Object.keys(weekCount).map(k => ({ period: k, counts: weekCount[k] }));

    res.json({ trendsData, deptData, peakData });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('actorId', 'name role department').sort('-createdAt').limit(100);
    res.json(logs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getDashboardAnalytics, getAuditLogs };
