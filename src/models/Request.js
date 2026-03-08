import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    raisedBy: {
      role: {
        type: String,
        enum: ["STUDENT", "TEACHER"],
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },

    targetModel: {
      type: String,
      enum: ["Student", "Teacher"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    changes: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],

    reason: {
      type: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);
export default Request;
