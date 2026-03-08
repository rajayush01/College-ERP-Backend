import mongoose from "mongoose";

const markSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    marksObtained: {
      type: Number,
      required: true,
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true }
);

// One subject per student per exam
markSchema.index(
  { exam: 1, student: 1, subject: 1 },
  { unique: true }
);

const Mark = mongoose.model("Mark", markSchema);
export default Mark;
