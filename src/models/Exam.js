import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },

    //  MINOR → one teacher
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    //  MAJOR → multiple teachers (A/B/C sections)
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: ["MAJOR", "MINOR"],
      required: true,
    },

    // supports MAJOR + MINOR
    batches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true,
      },
    ],

    subjects: {
      type: [subjectSchema],
      required: true,
    },

      isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["CREATED", "EVALUATED", "PUBLISHED"],
      default: "CREATED",
    },

    publishedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
