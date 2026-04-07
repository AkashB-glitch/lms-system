const Leave = require('../models/Leave');
const User = require('../models/User');
const { calculateRiskScore } = require('../services/riskEngine');
const { updateBehaviorProfile } = require('../services/behaviorProfile');
const { determineApprovalChain } = require('../services/routingEngine');
const { checkLoadAndConflicts } = require('../services/loadBalancer');
const { logAudit } = require('../services/auditService');
const { sendNotification } = require('../services/socketService');

const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, attachments } = req.body;
    const userId = req.user._id;

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const durationDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;

    const { conflicts, warnings, isBlocked } = await checkLoadAndConflicts(req.user.department, sDate, eDate);

    if (isBlocked) {
      return res.status(400).json({ message: 'Request Blocked: Department load capacity (30%) exceeded on chosen dates. Suggest alternate dates.', warnings, conflicts });
    }

    let { score, isHighRisk } = await calculateRiskScore(userId, startDate, endDate, leaveType);
    
    // Retroactive Window Logic
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = new Date(startDate);
    checkDate.setHours(0,0,0,0);
    const diffInDays = (today - checkDate) / (1000 * 60 * 60 * 24);

    if (diffInDays > 2) {
      return res.status(400).json({ message: "Retroactive leave beyond 2 days is not allowed." });
    }
    
    let isLateRequest = false;
    if (diffInDays > 0) {
      isLateRequest = true;
      score += 30; // Late penalty
      isHighRisk = score >= 60;
    }

    let initialStatus = "PENDING_FACULTY";
    if (req.user.role === 'Faculty') initialStatus = "PENDING_HOD";

    const leave = await Leave.create({ userId, leaveType, startDate, endDate, reason, attachments, riskScore: score, isHighRisk, isLateRequest, status: initialStatus });

    if (initialStatus === "PENDING_FACULTY") sendNotification('FACULTY_ROOM', { message: `New leave request from student.`});

    await logAudit('LEAVE_APPLIED', 'Leave', leave._id, userId, { ...req.body, durationDays, isLateRequest });

    res.status(201).json({ leave, warnings, conflicts, isLateRequest });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    // Advanced Filtering integration
    const match = { userId: req.user._id };
    if (req.query.leaveType) match.leaveType = req.query.leaveType;
    if (req.query.status) match.status = req.query.status;

    const leaves = await Leave.find(match).sort('-createdAt');
    res.json(leaves);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPendingLeavesForMe = async (req, res) => {
  try {
    const myRole = req.user.role;
    
    let statusFilter = "PENDING_FACULTY";
    if (myRole === "HOD") statusFilter = "PENDING_HOD";
    if (myRole === "Admin" || myRole === "Student") statusFilter = "NONE";

    let pendingForMe = await Leave.find({ status: statusFilter }).populate('userId', 'name email department role').sort('-createdAt').exec();

    // Advanced Filtering inside RAM for now
    if (req.query.department) pendingForMe = pendingForMe.filter(l => l.userId.department === req.query.department);
    if (req.query.leaveType) pendingForMe = pendingForMe.filter(l => l.leaveType === req.query.leaveType);
    if (req.query.risk === 'high') pendingForMe = pendingForMe.filter(l => l.isHighRisk);

    res.json(pendingForMe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) throw new Error('Leave not found');

    let isNewlyApproved = false;

    if (req.user.role === 'Faculty') {
      if (leave.status !== 'PENDING_FACULTY') throw new Error('Leave is not pending faculty approval');
      leave.status = 'PENDING_HOD';
      leave.facultyApprovedBy = req.user._id;
      sendNotification(leave.userId, { message: `Leave forwarded for HOD approval`, leaveId: leave._id });
    } else if (req.user.role === 'HOD') {
      if (leave.status !== 'PENDING_HOD') throw new Error('Faculty approval required first');
      leave.status = 'APPROVED';
      leave.hodApprovedBy = req.user._id;
      await updateBehaviorProfile(leave.userId);
      sendNotification(leave.userId, { message: `Your leave has been APPROVED by HOD!`, leaveId: leave._id });
      isNewlyApproved = true;
    } else if (req.user.role === 'Admin') {
      leave.status = 'APPROVED';
      await updateBehaviorProfile(leave.userId);
      isNewlyApproved = true;
    }

    await leave.save();
    
    // Auto-Mark Attendance as LEAVE integration
    if (isNewlyApproved) {
      const Attendance = require('../models/Attendance');
      const sDate = new Date(leave.startDate);
      const eDate = new Date(leave.endDate);
      const diffDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < diffDays; i++) {
        let dt = new Date(sDate);
        dt.setDate(dt.getDate() + i);
        
        await Attendance.findOneAndUpdate(
          { studentId: leave.userId, date: dt },
          { status: 'LEAVE', markedBy: req.user._id },
          { upsert: true }
        );
      }
    }
    
    await logAudit('LEAVE_APPROVED', 'Leave', leave._id, req.user._id, { role: req.user.role });

    res.json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) throw new Error('Leave not found');

    leave.status = 'REJECTED';
    leave.rejectionReason = "Rejected by " + req.user.role;

    await leave.save();
    
    await logAudit('LEAVE_REJECTED', 'Leave', leave._id, req.user._id, { role: req.user.role });
    sendNotification(leave.userId, { message: `Your leave request has been rejected`, leaveId: leave._id, status: leave.status });

    res.json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    // Advanced Query Filters
    const queryObj = {};
    if (req.query.leaveType) queryObj.leaveType = req.query.leaveType;
    if (req.query.status) queryObj.status = req.query.status;
    if (req.query.risk === 'high') queryObj.isHighRisk = true;

    let q = Leave.find(queryObj).populate('userId', 'name role department').sort('-createdAt');
    const leaves = await q.exec();
    
    // Filter department
    let filtered = leaves;
    if (req.query.department) {
       filtered = leaves.filter(l => l.userId && l.userId.department === req.query.department);
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { applyLeave, getMyLeaves, getPendingLeavesForMe, approveLeave, rejectLeave, getAllLeaves };
