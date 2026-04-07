const Rule = require('../models/Rule');
const determineApprovalChain = async (userRole, durationDays, leaveType, isHighRisk) => {
  const rules = await Rule.find().sort({ priority: -1 });
  
  for (let rule of rules) {
    let match = true;
    if (rule.condition.roles && rule.condition.roles.length > 0 && !rule.condition.roles.includes(userRole)) match = false;
    if (rule.condition.maxDays && durationDays > rule.condition.maxDays) match = false;
    if (rule.condition.minDays && durationDays < rule.condition.minDays) match = false;
    if (rule.condition.leaveTypes && rule.condition.leaveTypes.length > 0 && !rule.condition.leaveTypes.includes(leaveType)) match = false;
    if (rule.condition.isHighRisk !== undefined && rule.condition.isHighRisk !== isHighRisk) match = false;
    
    if (match) {
      return rule.approvalChain.map((step) => ({ role: step.role, status: 'Pending' }));
    }
  }
  
  // Default fallbacks if DB empty
  if (userRole === 'Student') return durationDays <= 2 ? [{ role: 'Faculty', status: 'Pending' }] : [{ role: 'Faculty', status: 'Pending' }, { role: 'HOD', status: 'Pending' }];
  if (userRole === 'Faculty') return [{ role: 'HOD', status: 'Pending' }];
  return [{ role: 'Admin', status: 'Pending' }];
};

const seedRules = async () => {
  const cnt = await Rule.countDocuments();
  if (cnt === 0) {
    await Rule.create({ priority: 100, condition: { isHighRisk: true }, approvalChain: [{ role: 'Admin' }] });
    await Rule.create({ priority: 90, condition: { leaveTypes: ['Medical'] }, approvalChain: [{ role: 'HOD' }] });
    await Rule.create({ priority: 50, condition: { roles: ['Student'], maxDays: 2 }, approvalChain: [{ role: 'Faculty' }] });
    await Rule.create({ priority: 40, condition: { roles: ['Student'], minDays: 3 }, approvalChain: [{ role: 'Faculty' }, { role: 'HOD' }] });
    await Rule.create({ priority: 20, condition: { roles: ['Faculty'] }, approvalChain: [{ role: 'HOD' }] });
  }
}
module.exports = { determineApprovalChain, seedRules };
