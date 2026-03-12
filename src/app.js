import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⬇️ explicitly load .env from project root
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

console.log("🧪 ENV CHECK:", {
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
});

import express from "express";
import cors from "cors";




// ===== ADMIN ROUTES =====
import adminAuthRoutes from "./routes/admin/adminAuth.routes.js";
import adminBatchRoutes from "./routes/admin/batch.routes.js";
import adminRequestRoutes from "./routes/admin/request.routes.js";
import adminTimetableRoutes from "./routes/admin/timetable.routes.js";
import adminStudentRoutes from "./routes/admin/student.routes.js";
import adminTeacherRoutes from "./routes/admin/teacher.routes.js";
import adminLeavePolicyRoutes from "./routes/admin/leavePolicy.routes.js";
import adminLeaveRoutes from "./routes/admin/leave.routes.js";
import adminDocsRoutes from "./routes/admin/SharedDocument.routes.js";
import adminDashboardRoutes from "./routes/admin/dashboard.routes.js";
import TeacherAttendance from "./routes/admin/teacherAttendance.routes.js";
import CreateExam from "./routes/admin/exam.routes.js";
import sendNotification from "./routes/admin/notification.routes.js";
import adminFeeStructureRoutes from "./routes/admin/feeStructure.routes.js";
import adminFeeRecordRoutes from "./routes/admin/feeRecord.routes.js";
import examPublishRoutes from "./routes/admin/examPublish.routes.js";

// ===== TEACHER ROUTES =====
import teacherAuthRoutes from "./routes/teacher/auth.routes.js";
import teacherProfileRoutes from "./routes/teacher/profile.routes.js";
import teacherRequestRoutes from "./routes/teacher/request.routes.js";
import teacherLeaveRoutes from "./routes/teacher/leave.routes.js";
import teacherAttendanceRoutes from "./routes/teacher/attendance.routes.js";
import teacherMarksRoutes from "./routes/teacher/marks.routes.js";
import teacherNotificationRoutes from "./routes/teacher/notification.routes.js";
import teacherStudentsRoutes from "./routes/teacher/students.routes.js";
import teacherAssignmentRoutes from "./routes/teacher/assignment.routes.js";
import teacherAssignmentGradingRoutes from "./routes/teacher/assignmentGrading.routes.js";
import teacherTimetable from "./routes/teacher/timetable.routes.js";

// ===== STUDENT ROUTES =====
import studentAuthRoutes from "./routes/student/auth.routes.js";
import studentProfileRoutes from "./routes/student/profile.routes.js";
import studentAttendanceRoutes from "./routes/student/attendance.routes.js";
import studentTimetableRoutes from "./routes/student/timetable.routes.js";
import studentAssignmentRoutes from "./routes/student/assignment.routes.js";
import studentResultRoutes from "./routes/student/result.routes.js";
import studentRequestRoutes from "./routes/student/request.routes.js";
import studentNotificationRoutes from "./routes/student/notification.rotes.js";
import studentFeeRoutes from "./routes/student/fee.routes.js";

import r2Routes from "./routes/r2.routes.js";






import sharedDocsRoutes from "./routes/common/SharedDocument.routes.js";
import { createExam } from "./controllers/admin/exam.controller.js";

const app = express();

// app.use(
//   cors({
//     origin: "http://localhost:5173", // 👈 frontend origin
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://college-erp-final.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);


app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")));



app.use("/api/r2", r2Routes);

// ===== ADMIN =====
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/batches", adminBatchRoutes);
app.use("/api/admin/requests", adminRequestRoutes);
app.use("/api/admin/timetable", adminTimetableRoutes);
app.use("/api/admin/students", adminStudentRoutes);
app.use("/api/admin/teachers", adminTeacherRoutes);
app.use("/api/admin/leave-policy", adminLeavePolicyRoutes);
app.use("/api/admin/leaves", adminLeaveRoutes);
app.use("/api/admin/documents", adminDocsRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/teacher-attendance", TeacherAttendance);
app.use("/api/admin/exam",CreateExam);
app.use("/api/admin/notification",sendNotification);
app.use("/api/admin/fee-structures", adminFeeStructureRoutes);
app.use("/api/admin/fee-records", adminFeeRecordRoutes);
app.use("/api/admin/exam-publish", examPublishRoutes);



// ===== TEACHER =====
app.use("/api/teacher/auth", teacherAuthRoutes);
app.use("/api/teacher/profile", teacherProfileRoutes);
app.use("/api/teacher/requests", teacherRequestRoutes);
app.use("/api/teacher/leaves", teacherLeaveRoutes);
app.use("/api/teacher/attendance", teacherAttendanceRoutes);
app.use("/api/teacher/marks", teacherMarksRoutes);
app.use("/api/teacher/notifications", teacherNotificationRoutes);
app.use("/api/teacher/students", teacherStudentsRoutes);
app.use("/api/teacher/assignments", teacherAssignmentRoutes);
app.use("/api/teacher/assignment-grading", teacherAssignmentGradingRoutes);
app.use("/api/teacher/timetable",teacherTimetable);

// ===== STUDENT =====
app.use("/api/student/auth", studentAuthRoutes);
app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/student/attendance", studentAttendanceRoutes);
app.use("/api/student/timetable", studentTimetableRoutes);
app.use("/api/student/assignments", studentAssignmentRoutes);
app.use("/api/student/results", studentResultRoutes);
app.use("/api/student/requests", studentRequestRoutes);
app.use("/api/student/notifications", studentNotificationRoutes);
app.use("/api/student/fees", studentFeeRoutes);



app.use("/api/documents", sharedDocsRoutes);

export default app;
