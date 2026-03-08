import mongoose from "mongoose";

const teacherLeaveBalanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    paidLeavesUsed: {
      type: Number,
      default: 0,
    },

    unpaidLeavesUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure one balance per teacher per year
teacherLeaveBalanceSchema.index(
  { teacher: 1, year: 1 },
  { unique: true }
);

const TeacherLeaveBalance = mongoose.model(
  "TeacherLeaveBalance",
  teacherLeaveBalanceSchema
);

export default TeacherLeaveBalance;
