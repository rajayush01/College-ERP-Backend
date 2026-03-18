import mongoose from "mongoose";

const periodSchema = new mongoose.Schema(
  {
    periodNumber: { type: Number, required: true },
    subject: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, trim: true },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
      required: true,
    },
    periods: [periodSchema],
  },
  { _id: false }
);

const facultyTimetableSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "My Timetable",
    },
    // PDF upload (optional)
    fileUrl: { type: String },
    fileKey: { type: String },
    // Manual schedule (optional)
    schedule: [dayScheduleSchema],
    type: {
      type: String,
      enum: ["PDF", "MANUAL"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FacultyTimetable", facultyTimetableSchema);
