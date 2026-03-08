import bcrypt from "bcryptjs";
import Teacher from "../../models/Teacher.js";
import { generateToken } from "../../utils/generateToken.js";

/**
 * Teacher Login
 */
export const teacherLogin = async (req, res) => {
  try {
    const { teacherId, password } = req.body;

    // 1️⃣ Validate input
    if (!teacherId || !password) {
      return res.status(400).json({
        message: "Teacher ID and password are required",
      });
    }

    // 2️⃣ Fetch teacher with password explicitly
    const teacher = await Teacher.findOne({ teacherId }).select("+password");
    if (!teacher) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Generate JWT
    const token = generateToken({
      id: teacher._id,
      role: "TEACHER",
    });

    // 5️⃣ Response (never expose password)
    res.status(200).json({
      message: "Login successful",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        teacherId: teacher.teacherId,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error("Teacher login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
