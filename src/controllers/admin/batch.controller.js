import Batch from "../../models/Class.js";

/**
 * =========================
 * Admin: Create Batch
 * =========================
 */
export const createBatch = async (req, res) => {
  try {
    const { batchName, department, program, semester, academicSession } = req.body;

    if (!batchName || !department || !program || !semester) {
      return res.status(400).json({
        message: "Batch name, department, program, and semester are required"
      });
    }

    const existing = await Batch.findOne({
      batchName: batchName.trim()
    });

    if (existing) {
      return res.status(400).json({
        message: "Batch already exists"
      });
    }

    const newBatch = await Batch.create({
      batchName: batchName.trim(),
      department: department.trim(),
      program: program.trim(),
      semester,
      academicSession
    });

    res.status(201).json(newBatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * Admin: Assign Batch Advisor
 * =========================
 */
export const assignBatchAdvisor = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { facultyId } = req.body;

    if (!facultyId) {
      return res.status(400).json({
        message: "facultyId is required"
      });
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      batchId,
      { batchAdvisor: facultyId },
      { new: true }
    )
      .populate("batchAdvisor")
      .populate("subjectFaculty.faculty");

    if (!updatedBatch) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    res.json(updatedBatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * Admin: Assign / Update Subject Faculty
 * =========================
 */
export const assignSubjectFaculty = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { subject, facultyId } = req.body;

    if (!subject || !facultyId) {
      return res.status(400).json({
        message: "subject and facultyId are required"
      });
    }

    const batchData = await Batch.findById(batchId);

    if (!batchData) {
      return res.status(404).json({
        message: "Batch not found"
      });
    }

    const subjectIndex = batchData.subjectFaculty.findIndex(
      sf => sf.subject.toLowerCase() === subject.toLowerCase()
    );

    // 🔁 Update faculty if subject exists
    if (subjectIndex !== -1) {
      batchData.subjectFaculty[subjectIndex].faculty = facultyId;
    }
    // ➕ Add new subject
    else {
      batchData.subjectFaculty.push({
        subject: subject.trim(),
        faculty: facultyId
      });
    }

    await batchData.save();

    const populatedBatch = await Batch.findById(batchId)
      .populate("batchAdvisor")
      .populate("subjectFaculty.faculty");

    res.json(populatedBatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * =========================
 * Admin: Get All Batches
 * =========================
 */
export const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .select("batchName department program semester academicSession subjectFaculty batchAdvisor")
      .populate("subjectFaculty.faculty", "name teacherId")
      .populate("batchAdvisor", "name teacherId")
      .sort({ department: 1, semester: 1 });

    res.json(batches);
  } catch (error) {
    console.error("Get batches error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
