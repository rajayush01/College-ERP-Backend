import mongoose from "mongoose";

const sharedDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    fileUrl: {
      type: String, // Cloudinary / S3 / local path
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    visibleTo: {
      type: [String],
      enum: ["STUDENT", "TEACHER"],
      default: ["STUDENT", "TEACHER"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SharedDocument", sharedDocumentSchema);
