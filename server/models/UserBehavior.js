const mongoose = require('mongoose');
const behaviorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, default: 100 },
  tags: [{ type: String }],
  lastCalculated: { type: Date, default: Date.now }
});
module.exports = mongoose.model('UserBehavior', behaviorSchema);
