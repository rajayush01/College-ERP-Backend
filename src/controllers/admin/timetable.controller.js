import Timetable from "../../models/Timetable.js";
import TimetableDocument from "../../models/TimetableDocument.js";
import mongoose from "mongoose";

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * =========================
 * Admin: Create or Update Timetable (Manual)
 * =========================
 */
export const upsertTimetable = async (req, res) => {
  try {
    const { batchId, day, periods } = req.body;

    if (!batchId || !day || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({
        message: "batchId, day and periods are required",
      });
    }

    for (const p of periods) {
      if (!p.periodNumber || !p.subject || !p.startTime || !p.endTime) {
        return res.status(400).json({
          message:
            "Each period must have periodNumber, subject, startTime, endTime",
        });
      }
    }

    const timetable = await Timetable.findOneAndUpdate(
      { batchId, day },
      { batchId, day, periods },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Timetable saved successfully",
      timetable,
    });
  } catch (error) {
    console.error("Upsert timetable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin / Student / Teacher: View Batch Timetable
 * =========================
 */
export const getBatchTimetable = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID" });
    }

    const timetable = await Timetable.find({ batchId }).populate(
      "periods.faculty",
      "name teacherId"
    );

    timetable.sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );

    res.status(200).json(timetable);
  } catch (error) {
    console.error("Get batch timetable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Upload Timetable Document (Hybrid - supports both FormData and URL-based)
 * =========================
 */
export const uploadTimetableDocument = async (req, res) => {
  try {
    let batchId, title, fileUrl, fileKey, originalName;

    // Check if this is a FormData upload (multer) or URL-based upload
    if (req.file) {
      // FormData upload with multer
      batchId = req.body.batchId;
      title = req.body.title;

      if (!batchId) {
        return res.status(400).json({
          message: "batchId is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }

      // Upload to R2 with organized structure: timetables/batchId/filename
      const { uploadToR2 } = await import("../../services/r2Upload.service.js");
      const uploadResult = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        "timetables",
        batchId,
        req.file.mimetype
      );

      fileUrl = uploadResult.fileUrl;
      fileKey = uploadResult.fileKey;
      originalName = uploadResult.originalName;
    } else {
      // URL-based upload (legacy)
      ({ batchId, title, fileUrl, fileKey } = req.body);

      if (!batchId || !fileUrl || !fileKey) {
        return res.status(400).json({
          message: "batchId, fileUrl and fileKey are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
    }

    const doc = await TimetableDocument.create({
      batchId,
      title: title || "Batch Timetable",
      fileUrl,
      fileKey,
      originalName,
      uploadedBy: req.user.id,
      isActive: true,
    });

    res.status(201).json({
      message: "Timetable uploaded successfully",
      document: doc,
    });
  } catch (error) {
    console.error("Upload timetable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Enable / Disable Timetable Document
 * =========================
 */
export const toggleTimetableDoc = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid timetable document ID" });
    }

    const doc = await TimetableDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    doc.isActive = !doc.isActive;
    await doc.save();

    res.json({
      message: "Timetable visibility updated",
      isActive: doc.isActive,
    });
  } catch (error) {
    console.error("Toggle timetable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Get All Timetable Documents
 * =========================
 */
export const getAllTimetableDocuments = async (req, res) => {
  try {
    // Find all documents
    const documents = await TimetableDocument.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    // Manually populate batchId to avoid schema errors with old data
    const Batch = mongoose.model("Batch");
    const populatedDocs = await Promise.all(
      documents.map(async (doc) => {
        const docObj = doc.toObject();
        if (docObj.batchId) {
          const batch = await Batch.findById(docObj.batchId).select("batchName department program semester");
          docObj.batchId = batch;
        }
        return docObj;
      })
    );

    res.status(200).json(populatedDocs);
  } catch (error) {
    console.error("Get timetable documents error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
