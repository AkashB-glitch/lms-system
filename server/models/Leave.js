const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { 
    type: String, 
    enum: ['Medical', 'Casual', 'OD', 'Emergency'], 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["PENDING_FACULTY", "PENDING_HOD", "APPROVED", "REJECTED"], 
    default: "PENDING_FACULTY" 
  },
  isLateRequest: { type: Boolean, default: false },
  facultyApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hodApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  attachments: [{ type: String }],
  riskScore: { type: Number, default: 0 },
  isHighRisk: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
