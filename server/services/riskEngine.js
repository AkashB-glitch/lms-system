const Leave = require('../models/Leave');

const calculateRiskScore = async (userId, startDate, endDate, leaveType) => {
  let score = 0;
  
  // 1. Frequent Leaves Risk
  const pastMonth = new Date();
  pastMonth.setMonth(pastMonth.getMonth() - 1);
  
  const recentLeaves = await Leave.countDocuments({
    userId,
    startDate: { $gte: pastMonth }
  });
  
  if (recentLeaves > 2) score += 40;
  else if (recentLeaves > 1) score += 20;

  // 2. Exam-time leaves / Unfavorable patterns
  // Simulation: If leave happens in November or May (typical exam months)
  const month = new Date(startDate).getMonth();
  if (month === 4 || month === 10) { // May or Nov
    score += 40;
  }

  // 3. Pattern detection: always taking Friday/Monday for long weekend
  const startDay = new Date(startDate).getDay();
  const endDay = new Date(endDate).getDay();
  
  if (startDay === 1 || startDay === 5 || endDay === 1 || endDay === 5) {
    score += 20;
  }
  
  const isHighRisk = score >= 60;
  
  return { score, isHighRisk };
};

module.exports = { calculateRiskScore };
