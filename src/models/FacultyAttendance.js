import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE"],
      required: true,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // or "User" if admin is in User collection
      required: true,
    },
  },
  { timestamps: true }
);

/**
 *  Prevent duplicate attendance for same teacher on same date
 */
teacherAttendanceSchema.index(
  { teacher: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("TeacherAttendance", teacherAttendanceSchema);
