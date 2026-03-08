import mongoose from "mongoose";

const subjectFacultySchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    }
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String, // CSE-2022-2026
      required: true,
      trim: true,
      unique: true
    },

    department: {
      type: String,
      required: true
    },

    program: {
      type: String, // B.Tech / M.Tech / MBA
      required: true
    },

    semester: {
      type: Number,
      required: true
    },

    academicSession: {
      type: String // 2024-25
    },

    batchAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null
    },

    subjectFaculty: {
      type: [subjectFacultySchema],
      default: []
    }
  },
  { timestamps: true }
);

// 🔒 Prevent duplicate batches
batchSchema.index({ batchName: 1 }, { unique: true });

export default mongoose.model("Batch", batchSchema);
