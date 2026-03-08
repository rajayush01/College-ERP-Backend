import bcrypt from "bcryptjs";
import Admin from "../../models/Admin.js";
import { generateToken } from "../../utils/generateToken.js";

/**
 * Admin Login
 */
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // ⚠️ Must explicitly select password
  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    id: admin._id,
    role: admin.role,
  });

  res.status(200).json({
    message: "Login successful",
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
};
