import Batch from "../../models/Class.js";
import Student from "../../models/Student.js";

/**
 * Teacher: View assigned students batch-wise
 */
export const getAssignedStudents = async (req, res) => {
  const teacherId = req.user.id;

  // 1️⃣ Find batches where teacher is assigned
  const batches = await Batch.find({
    $or: [
      { batchAdvisor: teacherId },
      { "subjectFaculty.faculty": teacherId },
    ],
  }).populate("batchAdvisor", "name teacherId");

  if (!batches.length) {
    return res.json([]);
  }

  // 2️⃣ Build response
  const result = [];

  for (const batch of batches) {
    // Subjects taught by this teacher in this batch
    const subjectsTaught = batch.subjectFaculty
      .filter((sf) => sf.faculty.toString() === teacherId)
      .map((sf) => sf.subject);

    // Fetch students of this batch
    const students = await Student.find({ batchId: batch._id })
      .select(
        "studentId name enrollmentNumber department program semester fatherName motherName parentsEmail phoneNumbers bloodGroup caste dob joinedDate address"
      )
      .sort({ enrollmentNumber: 1 });

    result.push({
      batchId: batch._id,
      batchName: batch.batchName,
      department: batch.department,
      program: batch.program,
      semester: batch.semester,
      isBatchAdvisor:
        batch.batchAdvisor &&
        batch.batchAdvisor._id.toString() === teacherId,
      subjectsTaught,
      students,
    });
  }

  res.json(result);
};
