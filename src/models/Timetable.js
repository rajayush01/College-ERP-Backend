import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
      required: true,
    },

    periods: [
      {
        periodNumber: {
          type: Number,
          required: true,
        },
        subject: {
          type: String,
          required: true,
        },
        faculty: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Faculty",
        },
        startTime: {
          type: String, // "09:00"
          required: true,
        },
        endTime: {
          type: String, // "09:45"
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// One timetable per batch per day
timetableSchema.index({ batchId: 1, day: 1 }, { unique: true });

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
