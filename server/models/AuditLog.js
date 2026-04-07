const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: Object }
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', auditLogSchema);
