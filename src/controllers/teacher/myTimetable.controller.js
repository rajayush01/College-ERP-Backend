import FacultyTimetable from "../../models/FacultyTimetable.js";
import { uploadToR2 } from "../../services/r2Upload.service.js";

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * GET /api/teacher/my-timetable
 * Get all personal timetables for the logged-in teacher
 */
export const getMyPersonalTimetables = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const timetables = await FacultyTimetable.find({ facultyId }).sort({
      createdAt: -1,
    });
    res.json(timetables);
  } catch (err) {
    console.error("getMyPersonalTimetables error:", err);
    res.status(500).json({ message: "Failed to fetch timetables" });
  }
};

/**
 * POST /api/teacher/my-timetable/upload
 * Upload a PDF timetable
 */
export const uploadPersonalTimetablePDF = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      "faculty-timetables",
      facultyId,
      req.file.mimetype
    );

    const timetable = await FacultyTimetable.create({
      facultyId,
      title: title?.trim() || "My Timetable",
      fileUrl: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      type: "PDF",
    });

    res.status(201).json(timetable);
  } catch (err) {
    console.error("uploadPersonalTimetablePDF error:", err);
    res.status(500).json({ message: "Failed to upload timetable" });
  }
};

/**
 * POST /api/teacher/my-timetable/manual
 * Save a manually created timetable
 */
export const savePersonalTimetableManual = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { title, schedule } = req.body;

    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ message: "Schedule is required" });
    }

    // Sort days in correct order
    const sorted = [...schedule].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );

    const timetable = await FacultyTimetable.create({
      facultyId,
      title: title?.trim() || "My Timetable",
      schedule: sorted,
      type: "MANUAL",
    });

    res.status(201).json(timetable);
  } catch (err) {
    console.error("savePersonalTimetableManual error:", err);
    res.status(500).json({ message: "Failed to save timetable" });
  }
};

/**
 * DELETE /api/teacher/my-timetable/:id
 * Delete a personal timetable
 */
export const deletePersonalTimetable = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { id } = req.params;

    const timetable = await FacultyTimetable.findOne({ _id: id, facultyId });
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    await timetable.deleteOne();
    res.json({ message: "Timetable deleted" });
  } catch (err) {
    console.error("deletePersonalTimetable error:", err);
    res.status(500).json({ message: "Failed to delete timetable" });
  }
};
