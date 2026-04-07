const Leave = require('../models/Leave');
const UserBehavior = require('../models/UserBehavior');

const updateBehaviorProfile = async (userId) => {
  const leaves = await Leave.find({ userId, status: 'Approved' });
  let score = 100;
  let tags = new Set();
  
  let mondayFridayCount = 0;
  let recentLeaves = 0;
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  leaves.forEach(l => {
    let s = new Date(l.startDate).getDay();
    let e = new Date(l.endDate).getDay();
    if (s === 1 || s === 5 || e === 1 || e === 5) mondayFridayCount++;
    
    if (new Date(l.startDate) > oneMonthAgo) recentLeaves++;
  });
  
  if (recentLeaves > 2) {
     score -= 20;
     tags.add('Frequent Absence');
  }
  
  if (mondayFridayCount >= 2) {
     score -= 30;
     tags.add('Weekend Extender');
  }
  
  const behavior = await UserBehavior.findOneAndUpdate(
    { userId },
    { score: Math.max(0, score), tags: Array.from(tags), lastCalculated: Date.now() },
    { upsert: true, new: true }
  );
  
  return behavior;
};

module.exports = { updateBehaviorProfile };
