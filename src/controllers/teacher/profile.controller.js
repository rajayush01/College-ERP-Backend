import Teacher from "../../models/Teacher.js";

/**
 * Teacher: View own profile (READ ONLY)
 */
export const getMyProfile = async (req, res) => {
  const teacherId = req.user.id;

  const teacher = await Teacher.findById(teacherId).select(
    "-password -__v"
  );

  if (!teacher) {
    return res.status(404).json({ message: "Teacher not found" });
  }

  res.json({
    message: "Profile fetched successfully",
    teacher,
  });
};
