import Leave from "../../models/Leave.js";
import LeavePolicy from "../../models/LeavePolicy.js";
import TeacherLeaveBalance from "../../models/TeacherLeaveBalance.js";

/**
 * Teacher: Apply for leave
 */
export const applyLeave = async (req, res) => {
  const teacherId = req.user.id;
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["PAID", "UNPAID"].includes(leaveType)) {
    return res.status(400).json({ message: "Invalid leave type" });
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: "End date cannot be before start date" });
  }

  const leave = await Leave.create({
    teacher: teacherId,
    leaveType,
    startDate,
    endDate,
    reason,
    status: "PENDING",
  });

  res.status(201).json({
    message: "Leave request submitted",
    leave,
  });
};


/**
 * Teacher: View own leave history
 */
export const getMyLeaves = async (req, res) => {
  const teacherId = req.user.id;

  const leaves = await Leave.find({ teacher: teacherId })
    .sort({ createdAt: -1 });

  res.json(leaves);
};




/**
 * Teacher: View leave balance (read-only)
 */
export const getMyLeaveBalance = async (req, res) => {
  const teacherId = req.user.id;
  const year = new Date().getFullYear();

  const policy = await LeavePolicy.findOne({ year });
  if (!policy) {
    return res.status(404).json({ message: "Leave policy not set for this year" });
  }

  const balance = await TeacherLeaveBalance.findOne({
    teacher: teacherId,
    year,
  });

  res.json({
    year,
    policy: {
      paidLeaveLimit: policy.paidLeaveLimit,
      unpaidLeaveLimit: policy.unpaidLeaveLimit,
    },
    used: {
      paid: balance?.paidLeavesUsed || 0,
      unpaid: balance?.unpaidLeavesUsed || 0,
    },
    remaining: {
      paid: policy.paidLeaveLimit - (balance?.paidLeavesUsed || 0),
      unpaid: policy.unpaidLeaveLimit - (balance?.unpaidLeavesUsed || 0),
    },
  });
};

