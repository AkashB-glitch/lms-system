const mongoose = require('mongoose');
const ruleSchema = new mongoose.Schema({
  priority: { type: Number, default: 0 },
  condition: {
    maxDays: { type: Number },
    minDays: { type: Number },
    roles: [{ type: String }],
    leaveTypes: [{ type: String }],
    isHighRisk: { type: Boolean }
  },
  approvalChain: [{ role: String }]
}, { timestamps: true });
module.exports = mongoose.model('Rule', ruleSchema);
