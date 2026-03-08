import Timetable from "../../models/Timetable.js";
import Batch from "../../models/Class.js";
import TimetableDocument from "../../models/TimetableDocument.js";

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Teacher: Get timetable for a batch I am assigned to
 */
export const getMyBatchTimetable = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId } = req.params;

    // Validate batch
    const batchData = await Batch.findById(batchId);
    if (!batchData) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Check teacher assignment
    const isBatchAdvisor =
      batchData.batchAdvisor?.toString() === teacherId;

    const isSubjectFaculty = batchData.subjectFaculty.some(
      (sf) => sf.faculty.toString() === teacherId
    );

    if (!isBatchAdvisor && !isSubjectFaculty) {
      return res.status(403).json({
        message: "You are not assigned to this batch",
      });
    }

    // Fetch timetable
    const timetable = await Timetable.find({ batchId })
      .populate("periods.faculty", "name teacherId")
      .sort({ day: 1 });

    // Ensure correct weekday order
    timetable.sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );

    res.json(timetable);
  } catch (error) {
    console.error("Teacher timetable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyTimetableDocuments = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Find batches where teacher is assigned
    const batches = await Batch.find({
      $or: [
        { batchAdvisor: teacherId },
        { "subjectFaculty.faculty": teacherId },
      ],
    }).select("_id");

    const batchIds = batches.map((b) => b._id);

    if (!batchIds.length) {
      return res.json([]);
    }

    // Fetch active timetable docs
    const documents = await TimetableDocument.find({
      batchId: { $in: batchIds },
      isActive: true,
    })
      .populate("batchId", "batchName department program semester")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error("Teacher timetable docs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
