import mongoose from "mongoose";
import Teacher from "../../models/Teacher.js";
import TeacherAttendance from "../../models/FacultyAttendance.js";

/**
 * Admin: Mark Teacher Attendance
 */
export const markTeacherAttendance = async (req, res) => {
  try {
    console.log("🔍 [markTeacherAttendance] Request received");

    const { date, records } = req.body;

    console.log("📅 Date:", date);
    console.log("📋 Records:", records);

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: "Date and attendance records are required",
      });
    }

    const bulkOps = [];

    for (const record of records) {
      const { teacherId, status } = record;

      console.log("➡️ Resolving teacherId:", teacherId);

      // 🔍 Find teacher by business teacherId
      const teacher = await Teacher.findOne({ teacherId }).select("_id");

      if (!teacher) {
        console.error(`❌ Teacher not found for teacherId: ${teacherId}`);
        return res.status(400).json({
          message: `Invalid teacherId: ${teacherId}`,
        });
      }

      console.log("✅ Teacher resolved:", teacher._id.toString());

      bulkOps.push({
        updateOne: {
          filter: {
            teacher: teacher._id,
            date: new Date(date),
          },
          update: {
            $set: {
              teacher: teacher._id,
              date: new Date(date),
              status,
              markedAt: new Date(),
              markedBy: req.user.id,
            },
          },
          upsert: true,
        },
      });
    }

    console.log("📦 Bulk operations:", bulkOps.length);

    await TeacherAttendance.bulkWrite(bulkOps);

    console.log("✅ Teacher attendance marked successfully");

    return res.json({
      message: "Teacher attendance marked successfully",
    });
  } catch (error) {
    console.error("🔥 [markTeacherAttendance] Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const getTeacherAttendanceReport = async (req, res) => {
  try {
    console.log("🔍 [getTeacherAttendanceReport] Request received");

    const { type = "day", date } = req.query;

    const baseDate = date ? new Date(date) : new Date();

    let start, end;

    if (type === "day") {
      start = new Date(baseDate.setHours(0, 0, 0, 0));
      end = new Date(baseDate.setHours(23, 59, 59, 999));
    } else if (type === "week") {
      const day = baseDate.getDay();
      start = new Date(baseDate);
      start.setDate(baseDate.getDate() - day);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (type === "month") {
      start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    console.log(`📅 Range: ${start.toISOString()} → ${end.toISOString()}`);

    /* 1️⃣ Get ALL teachers */
    const teachers = await Teacher.find()
      .select("name teacherId");

    /* 2️⃣ Get attendance for range */
    const attendance = await TeacherAttendance.find({
      date: { $gte: start, $lte: end },
    }).populate("teacher", "name teacherId");

    /* 3️⃣ Map attendance by teacherId */
    const attendanceMap = {};
    attendance.forEach((a) => {
      attendanceMap[a.teacher._id.toString()] = {
        status: a.status,
        markedAt: a.markedAt || null,
      };
    });

    /* 4️⃣ Merge teachers + attendance */
    const report = teachers.map((t) => {
      const entry = attendanceMap[t._id.toString()];
      return {
        teacherId: t.teacherId,
        name: t.name,
        status: entry?.status || "ABSENT",
        markedAt: entry?.markedAt || null,
      };
    });

    console.log(`✅ Attendance records returned: ${report.length}`);

    return res.json({
      type,
      date: baseDate,
      report,
    });
  } catch (error) {
    console.error("🔥 [getTeacherAttendanceReport] Error:", error);
    return res.status(500).json({
      message: "Failed to fetch teacher attendance report",
    });
  }
};


/**
 * Teacher: Get own attendance records
 */
export const getMyAttendance = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.user.id }).select("_id");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const records = await TeacherAttendance.find({ teacher: teacher._id })
      .sort({ date: -1 })
      .lean();

    return res.json({ records });
  } catch (error) {
    console.error("🔥 [getMyAttendance] Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
