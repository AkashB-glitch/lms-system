const Leave = require('../models/Leave');
const User = require('../models/User');
const CalendarEvent = require('../models/CalendarEvent');

const checkLoadAndConflicts = async (department, startDate, endDate) => {
  const overlappingEvents = await CalendarEvent.find({
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    $or: [{ department: department }, { department: null }]
  });

  const conflicts = overlappingEvents.map(e => `Overlaps with ${e.eventType}: ${e.title}`);

  const totalUsersInDept = await User.countDocuments({ department });
  
  // Actually need to find people in the same department who have overlapping leaves.
  // We can populate or aggregate, but for now we simplify by finding all leaves 
  // on these dates and then filtering by user's department.
  const leavesOnDates = await Leave.find({
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    status: { $in: ['Approved', 'Pending'] }
  }).populate('userId');

  const deptLeaves = leavesOnDates.filter(l => l.userId && l.userId.department === department).length;

  const percentage = totalUsersInDept > 0 ? (deptLeaves / totalUsersInDept) * 100 : 0;
  
  const warnings = [];
  let isBlocked = false;
  
  if (percentage >= 30) {
     warnings.push(`Threshold Exceeded: ${percentage.toFixed(1)}% of ${department} is already requested off on these dates.`);
     isBlocked = true; // Load balancer prevents it
  }
  
  return { conflicts, warnings, percentage, isBlocked };
};
module.exports = { checkLoadAndConflicts };
