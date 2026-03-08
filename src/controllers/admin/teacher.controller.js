import bcrypt from "bcryptjs";
import Teacher from "../../models/Teacher.js";
import generateTeacherId from "../../utils/generateTeacherId.js";
import mongoose from "mongoose";

/**
 * =========================
 * Admin: Create Teacher
 * =========================
 */
export const createTeacher = async (req, res) => {
  try {
    console.log("=== CREATE TEACHER REQUEST ===");
    console.log("Raw body:", req.body);
    console.log("File:", req.file);

    // Parse JSON strings from FormData
    if (typeof req.body.phoneNumbers === 'string') {
      try {
        req.body.phoneNumbers = JSON.parse(req.body.phoneNumbers);
        console.log("Parsed phoneNumbers:", req.body.phoneNumbers);
      } catch (e) {
        console.error("Failed to parse phoneNumbers:", e);
        return res.status(400).json({ message: "Invalid phoneNumbers format" });
      }
    }
    
    // Handle address - it's sent as an object through FormData
    if (typeof req.body.address === 'string') {
      try {
        req.body.address = JSON.parse(req.body.address);
        console.log("Parsed address:", req.body.address);
      } catch (e) {
        console.error("Failed to parse address:", e);
        // If parsing fails, set to empty object
        req.body.address = {};
      }
    }
    
    if (typeof req.body.qualifications === 'string') {
      try {
        req.body.qualifications = JSON.parse(req.body.qualifications);
        console.log("Parsed qualifications:", req.body.qualifications);
      } catch (e) {
        console.error("Failed to parse qualifications:", e);
        // If parsing fails, set to empty array
        req.body.qualifications = [];
      }
    }

    const {
      name,
      fatherName,
      motherName,
      email,
      phoneNumbers,
      address,
      dob,
      joinedDate,
      bloodGroup,
      maritalStatus,
      partnerName,
      qualifications,
      department,
      designation,
    } = req.body;

    console.log("Extracted data:", {
      name,
      fatherName,
      motherName,
      email,
      phoneNumbers,
      address,
      dob,
      bloodGroup,
      maritalStatus,
      department,
      designation
    });

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    if (!dob) {
      return res.status(400).json({ message: "Date of birth is required" });
    }

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    console.log("Received phoneNumbers:", phoneNumbers, "Type:", typeof phoneNumbers);

    if (!Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        message: "Phone numbers must be an array. Received: " + typeof phoneNumbers,
      });
    }

    const primaryPhones = phoneNumbers.filter(
      (p) => p.label === "primary" && p.number
    );
    const secondaryPhones = phoneNumbers.filter(
      (p) => p.label === "secondary" && p.number
    );

    if (primaryPhones.length !== 1) {
      return res.status(400).json({
        message: "Exactly one primary phone number is required. Found: " + primaryPhones.length,
      });
    }

    if (secondaryPhones.length > 1) {
      return res.status(400).json({
        message: "Only one secondary phone number is allowed",
      });
    }

    /* =========================
       UNIQUE EMAIL CHECK
    ========================= */
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        message: "Teacher with this email already exists",
      });
    }

    /* =========================
       GENERATE CREDENTIALS
    ========================= */
    const teacherId = await generateTeacherId();
    const defaultPassword = "teacher@123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let imageUrl = null;

    // Handle photo upload if provided
    if (req.file) {
      const { uploadToR2 } = await import("../../services/r2Upload.service.js");
      const uploadResult = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        "teacher-photos",
        teacherId, // Use generated teacherId for folder organization
        req.file.mimetype
      );
      imageUrl = uploadResult.fileUrl;
    }

    /* =========================
       CREATE TEACHER
    ========================= */
    const teacher = await Teacher.create({
      teacherId,
      name,
      fatherName,
      motherName,
      email,
      password: hashedPassword,
      phoneNumbers,
      address,
      dob,
      joinedDate,
      bloodGroup,
      maritalStatus,
      partnerName,
      department,
      designation: designation || "Assistant Professor",
      qualifications: Array.isArray(qualifications)
        ? qualifications
        : [],

      image: imageUrl,
    });

    return res.status(201).json({
      message: "Teacher created successfully",
      _id: teacher._id,
      teacherId: teacher.teacherId,
      defaultPassword, // shown once
      imageUrl,
    });
  } catch (error) {
    console.error("Create teacher error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: List Teachers
 * =========================
 */
export const listTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const teachers = await Teacher.find()
      .select(
        "name fatherName motherName teacherId email phoneNumbers joinedDate bloodGroup maritalStatus partnerName image"
      )
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments();

    return res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      teachers,
    });
  } catch (error) {
    console.error("List teachers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: View Single Teacher
 * =========================
 */
export const getTeacherById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    const teacher = await Teacher.findById(id).select("-__v");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.json(teacher);
  } catch (error) {
    console.error("Get teacher by ID error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Teachers Dropdown
 * =========================
 */
export const getAllTeachersForDropdown = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select("_id name teacherId")
      .sort({ name: 1 });

    res.json(teachers);
  } catch (error) {
    console.error("Get teachers dropdown error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Update Teacher
 * =========================
 */
export const updateTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    // Parse JSON strings from FormData
    if (typeof req.body.phoneNumbers === 'string') {
      try {
        req.body.phoneNumbers = JSON.parse(req.body.phoneNumbers);
      } catch (e) {
        console.error("Failed to parse phoneNumbers:", e);
        return res.status(400).json({ message: "Invalid phoneNumbers format" });
      }
    }
    
    if (typeof req.body.address === 'string') {
      try {
        req.body.address = JSON.parse(req.body.address);
      } catch (e) {
        console.error("Failed to parse address:", e);
        req.body.address = {};
      }
    }
    
    if (typeof req.body.qualifications === 'string') {
      try {
        req.body.qualifications = JSON.parse(req.body.qualifications);
      } catch (e) {
        console.error("Failed to parse qualifications:", e);
        req.body.qualifications = [];
      }
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const {
      name,
      fatherName,
      motherName,
      email,
      phoneNumbers,
      address,
      dob,
      joinedDate,
      bloodGroup,
      maritalStatus,
      partnerName,
      qualifications,
      department,
      designation,
    } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    if (!dob) {
      return res.status(400).json({
        message: "Date of birth is required",
      });
    }

    if (!Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        message: "Phone numbers must be an array",
      });
    }

    const primaryPhones = phoneNumbers.filter(
      (p) => p.label === "primary" && p.number
    );
    const secondaryPhones = phoneNumbers.filter(
      (p) => p.label === "secondary" && p.number
    );

    if (primaryPhones.length !== 1) {
      return res.status(400).json({
        message: "Exactly one primary phone number is required",
      });
    }

    if (secondaryPhones.length > 1) {
      return res.status(400).json({
        message: "Only one secondary phone number is allowed",
      });
    }

    /* =========================
       EMAIL UNIQUE CHECK
    ========================= */
    const emailOwner = await Teacher.findOne({
      email,
      _id: { $ne: id },
    });

    if (emailOwner) {
      return res.status(400).json({
        message: "Another teacher already uses this email",
      });
    }

    // Handle photo upload if provided
    let imageUrl = teacher.image; // Keep existing image by default
    if (req.file) {
      const { uploadToR2 } = await import("../../services/r2Upload.service.js");
      const uploadResult = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        "teacher-photos",
        teacher.teacherId, // Use existing teacherId
        req.file.mimetype
      );
      imageUrl = uploadResult.fileUrl;
    }

    /* =========================
       UPDATE FIELDS
    ========================= */
    teacher.name = name;
    teacher.fatherName = fatherName || "";
    teacher.motherName = motherName || "";
    teacher.email = email;
    teacher.phoneNumbers = phoneNumbers;
    teacher.address = address || {};
    teacher.dob = dob;
    teacher.joinedDate = joinedDate || undefined;
    teacher.bloodGroup = bloodGroup || undefined;
    teacher.maritalStatus = maritalStatus || undefined;
    teacher.partnerName =
      maritalStatus === "Married" ? partnerName || "" : undefined;
    teacher.department = department;
    teacher.designation = designation || "Assistant Professor";
    teacher.image = imageUrl;
    teacher.qualifications = Array.isArray(qualifications)
      ? qualifications
      : [];

    await teacher.save();

    return res.json({ 
      message: "Teacher updated successfully",
      imageUrl 
    });
  } catch (error) {
    console.error("Update teacher error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Upload Teacher Documents (URL-based)
 * =========================
 */
/**
 * =========================
 * Admin: Upload Teacher Documents (Multer + R2)
 * =========================
 */
export const uploadTeacherDocumentsController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!title) {
      return res.status(400).json({ message: "Document title is required" });
    }

    // Upload to R2 with organized structure: teacher-documents/teacherId/filename
    const { uploadToR2 } = await import("../../services/r2Upload.service.js");
    const uploadResult = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      "teacher-documents",
      id,
      req.file.mimetype
    );

    const newDocument = {
      title,
      fileUrl: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      originalName: uploadResult.originalName,
      uploadedAt: new Date(),
    };

    teacher.documents.push(newDocument);
    await teacher.save();

    return res.json({
      message: "Document uploaded successfully",
      document: newDocument,
      documents: teacher.documents,
    });
  } catch (error) {
    console.error("Upload teacher document error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
