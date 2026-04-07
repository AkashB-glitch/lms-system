const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Leave = require('../models/Leave');

const markAttendance = async (req, res) => {
  try {
    let { studentIds, date, status } = req.body;
    const markedDt = new Date(date);
    markedDt.setHours(0,0,0,0);
    
    // Make Faculty life easier: allow blank array or 'all' to mark every student in the database
    if (!studentIds || studentIds.length === 0 || studentIds[0].toLowerCase() === 'all' || studentIds[0] === '') {
       const students = await User.find({ role: 'Student' });
       studentIds = students.map(s => s._id);
    } else {
       // Support real names instead of requiring copying long Hex ObjectIDs
       const parsedIds = [];
       for (let nameOrId of studentIds) {
          if (nameOrId.length === 24 && /^[0-9a-fA-F]{24}$/.test(nameOrId)) {
             parsedIds.push(nameOrId);
          } else {
             const u = await User.findOne({ name: new RegExp(nameOrId, "i"), role: 'Student' });
             if (u) parsedIds.push(u._id);
          }
       }
       studentIds = parsedIds;
    }
    
    for (let sId of studentIds) {
      await Attendance.findOneAndUpdate(
        { studentId: sId, date: markedDt },
        { status, markedBy: req.user._id },
        { upsert: true }
      );
    }
    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.params.id || req.user._id;
    const records = await Attendance.find({ studentId });
    const approvedLeaves = await Leave.find({ userId: studentId, status: { $regex: /^approved$/i } });
    
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0;
    let explicitMarkedDates = new Set();
    let mondayAbsences = 0;
    
    records.forEach(r => {
      let dateStr = new Date(r.date).toISOString().split('T')[0];
      explicitMarkedDates.add(dateStr);
      
      if (r.status === 'PRESENT') totalPresent++;
      if (r.status === 'ABSENT') totalAbsent++;
      if (r.status === 'LEAVE') totalLeave++;
      
      if (r.status === 'ABSENT' && new Date(r.date).getDay() === 1) mondayAbsences++;
    });

    let totalClasses = records.length;

    // Add instantaneous penalty drops by increasing total classes denominator for days taken as leave
    approvedLeaves.forEach(l => {
       let sDt = new Date(l.startDate); sDt.setHours(0,0,0,0);
       let eDt = new Date(l.endDate); eDt.setHours(23,59,59,999);
       
       for (let d = new Date(sDt); d <= eDt; d.setDate(d.getDate() + 1)) {
          let dStr = d.toISOString().split('T')[0];
          if (!explicitMarkedDates.has(dStr)) {
             totalClasses++;
             totalLeave++;
             explicitMarkedDates.add(dStr);
          }
       }
    });
    
    // Formula: Total Present / Total Days * 100
    const overall = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 100;
    
    let warning = null;
    let requiredNext = 0;
    if (overall < 75 && totalClasses > 0) {
       warning = overall < 65 ? "CRITICAL: Attendance below 65% threshold!" : "WARNING: Attendance below 75% threshold!";
       const reqClasses = Math.ceil((0.75 * totalClasses - totalPresent) / 0.25);
       if (reqClasses > 0) requiredNext = reqClasses;
    }
    
    const insights = [];
    if (mondayAbsences >= 3) insights.push("You are frequently absent on Mondays.");
    
    res.json({ overall, totalClasses, totalPresent, totalAbsent, totalLeave, warning, requiredNext, insights, records });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getSubjects = async (req, res) => {
  try {
     const subjects = await Subject.find();
     res.json(subjects);
  } catch (err) {
     res.status(400).json({ message: err.message });
  }
}

const requestDispute = async (req, res) => {
   try {
      const record = await Attendance.findOne({ _id: req.params.id, studentId: req.user._id });
      if (!record) throw new Error("Attendance record not found");
      if (record.status !== 'ABSENT') throw new Error("Can only dispute explicit absent marks.");
      if (record.disputeStatus === 'PENDING_REVIEW') throw new Error("A review is already pending.");
      
      record.disputeStatus = 'PENDING_REVIEW';
      record.disputeReason = req.body.reason || "I was physically present.";
      await record.save();
      
      res.json({ message: "Dispute forwarded to faculty successfully." });
   } catch(err) {
      res.status(400).json({ message: err.message });
   }
};

const getPendingDisputes = async (req, res) => {
   try {
      const disputes = await Attendance.find({ disputeStatus: 'PENDING_REVIEW' }).populate('studentId', 'name department email').sort('-date');
      res.json(disputes);
   } catch (err) {
      res.status(400).json({ message: err.message });
   }
};

const resolveDispute = async (req, res) => {
   try {
      const { approved } = req.body;
      const record = await Attendance.findById(req.params.id);
      if (!record) throw new Error("Record not found");
      
      if (approved) {
         record.status = 'PRESENT';
         record.disputeStatus = 'APPROVED';
         record.markedBy = req.user._id; // Faculty explicitly overrides
      } else {
         record.disputeStatus = 'REJECTED';
      }
      
      await record.save();
      res.json({ message: "Dispute resolved", record });
   } catch (err) {
      res.status(400).json({ message: err.message });
   }
};

const seedSubjects = async (req, res) => {
   await Subject.deleteMany({});
   await Subject.create([
      { name: 'Computer Networks', code: 'CS301' },
      { name: 'Artificial Intelligence', code: 'CS302' },
      { name: 'Data Structures', code: 'CS102' },
   ]);
   res.json({ message: "Seeded" });
};

module.exports = { markAttendance, getStudentAnalytics, getSubjects, seedSubjects, requestDispute, getPendingDisputes, resolveDispute };
