import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    target: {
      type: {
        type: String,
        enum: ["BATCH", "DEPARTMENT", "ALL_STUDENTS", "ALL_TEACHERS"],
        required: true,
      },

      batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },

      department: {
        type: String,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
