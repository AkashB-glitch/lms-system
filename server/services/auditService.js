const AuditLog = require('../models/AuditLog');
const logAudit = async (action, entity, entityId, actorId, details = {}) => {
  try {
    await AuditLog.create({ action, entity, entityId, actorId, details });
  } catch (err) { console.error("Audit log failed", err); }
};
module.exports = { logAudit };
