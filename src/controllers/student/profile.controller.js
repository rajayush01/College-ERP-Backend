import Student from "../../models/Student.js";

/**
 * Student: View own profile (READ ONLY)
 */
export const getMyProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log('📡 [Student Profile] Fetching profile for:', studentId);

    const student = await Student.findById(studentId)
      .populate("batchId", "batchName department program semester")
      .select("-password -__v");

    if (!student) {
      console.error('❌ [Student Profile] Student not found:', studentId);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log('✅ [Student Profile] Profile fetched:', student.name);

    res.json({
      message: "Profile fetched successfully",
      student,
    });
  } catch (error) {
    console.error('❌ [Student Profile] Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};
