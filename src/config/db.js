// src/config/db.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    //  Auto-create Super Admin (runs only if no admin exists)
    const adminExists = await Admin.findOne({
      email: process.env.ADMIN_EMAIL || "admin@college.com",
    });

    if (!adminExists) {
      const adminPassword =
        process.env.ADMIN_PASSWORD || "admin@123";

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await Admin.create({
        name: "Super Admin",
        email: process.env.ADMIN_EMAIL || "admin@college.com",
        password: hashedPassword,
        role: "ADMIN",
      });

      console.log("🚀 Super Admin created");
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
