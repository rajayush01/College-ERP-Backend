import bcrypt from "bcryptjs";
import Student from "../../models/Student.js";
import { generateToken } from "../../utils/generateToken.js";

/**
 * Student Login
 */
export const studentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  const student = await Student.findOne({ studentId }).select("+password");
  if (!student) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    id: student._id,
    role: "STUDENT",
  });

  res.json({
    message: "Login successful",
    token,
    student: {
      id: student._id,
      studentId: student.studentId,
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
      batchId: student.batchId,
      department: student.department,
      program: student.program,
      semester: student.semester,
    },
  });
};
