import LeavePolicy from "../../models/LeavePolicy.js";

/**
 * Admin: Create / Update Leave Policy
 */
export const setLeavePolicy = async (req, res) => {
  try {
    const { year, paidLeaveLimit, unpaidLeaveLimit } = req.body;

    if (
      !year ||
      paidLeaveLimit === undefined ||
      unpaidLeaveLimit === undefined
    ) {
      return res.status(400).json({
        message: "Year, paidLeaveLimit and unpaidLeaveLimit are required",
      });
    }

    const policy = await LeavePolicy.findOneAndUpdate(
      { year },
      { paidLeaveLimit, unpaidLeaveLimit },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Leave policy saved successfully",
      policy,
    });
  } catch (error) {
    console.error("Set leave policy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
