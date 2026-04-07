const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["PRESENT", "ABSENT", "LEAVE"],
    default: "ABSENT"
  },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  disputeStatus: {
    type: String,
    enum: ["NONE", "PENDING_REVIEW", "APPROVED", "REJECTED"],
    default: "NONE"
  },
  disputeReason: { type: String }
}, { timestamps: true });

// Prevent duplicate attendance for same student/date globally
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
