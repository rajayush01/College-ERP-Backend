import Leave from "../../models/Leave.js";
import LeavePolicy from "../../models/LeavePolicy.js";
import TeacherLeaveBalance from "../../models/TeacherLeaveBalance.js";

// Utility: calculate inclusive day count
const calculateDays = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Admin: Get all leave requests
 */
export const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .populate("teacher", "name teacherId")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Get all leaves error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Approve / Reject leave
 */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // APPROVED / REJECTED

    const leave = await Leave.findById(leaveId);
    if (!leave || leave.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid leave request" });
    }

    if (status === "APPROVED") {
      const year = new Date(leave.startDate).getFullYear();
      const days = calculateDays(leave.startDate, leave.endDate);

      const policy = await LeavePolicy.findOne({ year });
      if (!policy) {
        return res.status(400).json({ message: "Leave policy not set" });
      }

      let balance = await TeacherLeaveBalance.findOne({
        teacher: leave.teacher,
        year,
      });

      if (!balance) {
        balance = await TeacherLeaveBalance.create({
          teacher: leave.teacher,
          year,
        });
      }

      if (leave.leaveType === "PAID") {
        if (balance.paidLeavesUsed + days > policy.paidLeaveLimit) {
          return res.status(400).json({
            message: "Paid leave limit exceeded",
          });
        }
        balance.paidLeavesUsed += days;
      }

      if (leave.leaveType === "UNPAID") {
        if (balance.unpaidLeavesUsed + days > policy.unpaidLeaveLimit) {
          return res.status(400).json({
            message: "Unpaid leave limit exceeded",
          });
        }
        balance.unpaidLeavesUsed += days;
      }

      await balance.save();
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    await leave.save();

    res.json({ message: `Leave ${status.toLowerCase()}` });
  } catch (error) {
    console.error("Update leave status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Leave summary (counts by status)
 */
export const leaveSummary = async (req, res) => {
  try {
    const summary = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Leave summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Teacher leave history
 */
export const teacherLeaveHistory = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const history = await Leave.find({ teacher: teacherId }).sort({
      startDate: -1,
    });

    res.json(history);
  } catch (error) {
    console.error("Teacher leave history error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Get teacher leave balance for a year
 */
export const getTeacherLeaveBalance = async (req, res) => {
  try {
    const { teacherId, year } = req.query;

    const policy = await LeavePolicy.findOne({ year });
    if (!policy) {
      return res.status(404).json({ message: "Leave policy not found" });
    }

    const balance = await TeacherLeaveBalance.findOne({
      teacher: teacherId,
      year,
    });

    res.json({
      year,
      policy,
      used: balance || { paidLeavesUsed: 0, unpaidLeavesUsed: 0 },
      remaining: {
        paid: policy.paidLeaveLimit - (balance?.paidLeavesUsed || 0),
        unpaid:
          policy.unpaidLeaveLimit - (balance?.unpaidLeavesUsed || 0),
      },
    });
  } catch (error) {
    console.error("Get teacher leave balance error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
