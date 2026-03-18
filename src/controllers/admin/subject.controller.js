import Subject from "../../models/Subject.js";

// GET /api/admin/subjects
export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

// POST /api/admin/subjects
export const createSubject = async (req, res) => {
  try {
    const { name, code, department, program, semester } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: "Name and code are required" });
    }
    const subject = await Subject.create({ name, code, department, program, semester });
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Subject name or code already exists" });
    }
    res.status(500).json({ message: "Failed to create subject" });
  }
};

// DELETE /api/admin/subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete subject" });
  }
};
