import mongoose from "mongoose";

const leavePolicySchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },

    paidLeaveLimit: {
      type: Number,
      required: true,
    },

    unpaidLeaveLimit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const LeavePolicy = mongoose.model("LeavePolicy", leavePolicySchema);
export default LeavePolicy;
