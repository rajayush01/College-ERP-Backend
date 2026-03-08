import Teacher from "../models/Teacher.js";

const generateTeacherId = async () => {
  const year = new Date().getFullYear();

  const lastTeacher = await Teacher.findOne({
    teacherId: new RegExp(`^TCH${year}`),
  }).sort({ teacherId: -1 });

  let nextSeq = "0001";

  if (lastTeacher) {
    const lastNumber = parseInt(lastTeacher.teacherId.slice(7));
    nextSeq = String(lastNumber + 1).padStart(4, "0");
  }

  return `TCH${year}${nextSeq}`;
};

export default generateTeacherId;
