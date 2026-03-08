import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    files: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    marksObtained: {
      type: Number,
    },

    remarks: {
      type: String,
    },

    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    gradedAt: Date,
  },
  { timestamps: true }
);

// One submission per student per assignment
assignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);

export default mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);
