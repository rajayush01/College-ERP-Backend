import mongoose from "mongoose";

const notificationStatusSchema = new mongoose.Schema(
  {
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    role: {
      type: String,
      enum: ["STUDENT", "TEACHER"],
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One status per user per notification
notificationStatusSchema.index(
  { notification: 1, userId: 1 },
  { unique: true }
);

const NotificationStatus = mongoose.model(
  "NotificationStatus",
  notificationStatusSchema
);

export default NotificationStatus;
