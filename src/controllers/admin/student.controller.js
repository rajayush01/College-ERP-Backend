import bcrypt from "bcryptjs";
import Student from "../../models/Student.js";
import generateStudentId from "../../utils/generateStudentId.js";
import Batch from "../../models/Class.js";
import mongoose from "mongoose";

/**
 * =========================
 * Admin: Create Student
 * =========================
 */
export const createStudent = async (req, res) => {
  try {
    // Parse JSON strings from FormData
    if (typeof req.body.phoneNumbers === 'string') {
      req.body.phoneNumbers = JSON.parse(req.body.phoneNumbers);
    }

    const {
      name,
      enrollmentNumber,
      batchId,
      department,
      program,
      semester,
      fatherName,
      motherName,
      parentsEmail,
      studentEmail,
      address,
      phoneNumbers,
      bloodGroup,
      caste,
      dob,
      joinedDate,
    } = req.body;

    const batchDoc = await Batch.findById(batchId);
    if (!batchDoc) {
      return res.status(400).json({ message: "Invalid batch selected" });
    }

    const studentId = await generateStudentId();
    const defaultPassword = "student@123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let imageUrl = null;

    // Handle photo upload if provided
    if (req.file) {
      const { uploadToR2 } = await import("../../services/r2Upload.service.js");
      const uploadResult = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        "student-photos",
        studentId,
        req.file.mimetype
      );
      imageUrl = uploadResult.fileUrl;
    }

    const student = await Student.create({
      studentId,
      name,
      enrollmentNumber,
      batchId,
      department,
      program,
      semester,
      fatherName,
      motherName,
      parentsEmail,
      studentEmail,
      address,
      phoneNumbers,
      bloodGroup,
      caste,
      dob,
      joinedDate,
      image: imageUrl,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Student created successfully",
      _id: student._id,
      studentId: student.studentId,
      defaultPassword,
      imageUrl,
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: List Students
 * =========================
 */
export const listStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, batchId, department } = req.query;

    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (department) filter.department = department;

    const students = await Student.find(filter)
      .populate("batchId", "batchName department program semester")
      .select(
        "name enrollmentNumber department program semester parentsName phoneNumbers bloodGroup joinedDate"
      )
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(filter);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      students,
    });
  } catch (error) {
    console.error("List students error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Get Student By ID
 * =========================
 */
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("batchId", "batchName department program semester")
      .select("-__v");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Get student by ID error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Update Student
 * =========================
 */
export const updateStudent = async (req, res) => {
  try {
    // Parse JSON strings from FormData
    if (typeof req.body.phoneNumbers === 'string') {
      req.body.phoneNumbers = JSON.parse(req.body.phoneNumbers);
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const {
      name,
      enrollmentNumber,
      batchId,
      department,
      program,
      semester,
      fatherName,
      motherName,
      parentsEmail,
      studentEmail,
      address,
      phoneNumbers,
      bloodGroup,
      caste,
      dob,
      joinedDate,
    } = req.body;

    if (batchId) {
      const batchDoc = await Batch.findById(batchId);
      if (!batchDoc) {
        return res.status(400).json({ message: "Invalid batch selected" });
      }
      student.batchId = batchId;
    }

    // Handle photo upload if provided
    let imageUrl = student.image;
    if (req.file) {
      const { uploadToR2 } = await import("../../services/r2Upload.service.js");
      const uploadResult = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        "student-photos",
        student.studentId,
        req.file.mimetype
      );
      imageUrl = uploadResult.fileUrl;
    }

    student.name = name;
    student.enrollmentNumber = enrollmentNumber;
    student.department = department;
    student.program = program;
    student.semester = semester;
    student.fatherName = fatherName;
    student.motherName = motherName;
    student.parentsEmail = parentsEmail;
    student.studentEmail = studentEmail;
    student.address = address;
    student.phoneNumbers = phoneNumbers;
    student.bloodGroup = bloodGroup;
    student.caste = caste;
    student.dob = dob;
    student.joinedDate = joinedDate;
    student.image = imageUrl;

    await student.save();

    res.json({ 
      message: "Student updated successfully",
      imageUrl 
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Admin: Upload Student Documents (Multer + R2)
 * =========================
 */
export const uploadStudentDocumentsController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!title) {
      return res.status(400).json({ message: "Document title is required" });
    }

    // Upload to R2 with organized structure: student-documents/studentId/filename
    const { uploadToR2 } = await import("../../services/r2Upload.service.js");
    const uploadResult = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      "student-documents",
      studentId,
      req.file.mimetype
    );

    const newDocument = {
      title,
      fileUrl: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      originalName: uploadResult.originalName,
      uploadedAt: new Date(),
    };

    student.documents.push(newDocument);
    await student.save();

    res.status(201).json({
      message: "Document uploaded successfully",
      document: newDocument,
      documents: student.documents,
    });
  } catch (error) {
    console.error("Upload student document error:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
