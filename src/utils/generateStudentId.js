import Student from "../models/Student.js";

const generateStudentId = async () => {
  const year = new Date().getFullYear();

  const lastStudent = await Student.findOne({
    studentId: new RegExp(`^STU${year}`),
  }).sort({ studentId: -1 });

  let nextSeq = "0001";

  if (lastStudent) {
    const lastNumber = parseInt(lastStudent.studentId.slice(7));
    nextSeq = String(lastNumber + 1).padStart(4, "0");
  }

  return `STU${year}${nextSeq}`;
};

export default generateStudentId;
