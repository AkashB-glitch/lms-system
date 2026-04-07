const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  eventType: { type: String, enum: ['Exam', 'Holiday', 'Event'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  department: { type: String }
});
module.exports = mongoose.model('CalendarEvent', eventSchema);
