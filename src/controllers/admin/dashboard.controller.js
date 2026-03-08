import mongoose from "mongoose";
import Attendance from "../../models/Attendance.js";
import FacultyAttendance from "../../models/FacultyAttendance.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Teacher.js";
import Assignment from "../../models/Assignment.js";
import Batch from "../../models/Class.js";

/**
 * ==============================
 * GENERAL DASHBOARD STATS
 * ==============================
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalBatches,
      totalAssignments,
      recentAttendance
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Batch.countDocuments(),
      Assignment.countDocuments(),
      Attendance.find()
        .sort({ date: -1 })
        .limit(100)
        .populate('student', 'name enrollmentNumber')
    ]);

    // Calculate attendance rate from recent data
    const presentCount = recentAttendance.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = recentAttendance.length > 0 
      ? Math.round((presentCount / recentAttendance.length) * 100) 
      : 0;

    res.status(200).json({
      totalStudents,
      totalFaculty,
      totalBatches,
      totalAssignments,
      attendanceRate,
      recentAttendanceCount: recentAttendance.length
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ==============================
 * STUDENT ATTENDANCE SUMMARY
 * Overall attendance percentage
 * ==============================
 */
export const studentAttendanceSummary = async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      {
        $group: {
          _id: "$student",
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          attendancePercentage: {
            $cond: [
              { $eq: ["$totalDays", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$presentDays", "$totalDays"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          studentName: "$student.name",
          enrollmentNumber: "$student.enrollmentNumber",
          attendancePercentage: 1,
        },
      },
    ]);

    res.status(200).json(summary);
  } catch (error) {
    console.error("Student attendance summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ==============================
 * LOW ATTENDANCE STUDENTS (<75%)
 * ==============================
 */
export const lowAttendanceStudents = async (req, res) => {
  try {
    const { batchId } = req.query;

    const pipeline = [
      ...(batchId
        ? [
            {
              $match: {
                batchId: new mongoose.Types.ObjectId(batchId),
              },
            },
          ]
        : []),
      {
        $group: {
          _id: "$student",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          attendancePercentage: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$present", "$total"] },
                  100,
                ],
              },
            ],
          },
        },
      },
      { $match: { attendancePercentage: { $lt: 75 } } },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          studentName: "$student.name",
          enrollmentNumber: "$student.enrollmentNumber",
          attendancePercentage: {
            $round: ["$attendancePercentage", 2],
          },
        },
      },
    ];

    const data = await Attendance.aggregate(pipeline);
    res.status(200).json(data);
  } catch (error) {
    console.error("Low attendance error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ==============================
 * FACULTY PRESENCE SUMMARY
 * ==============================
 */
export const facultyPresenceSummary = async (req, res) => {
  try {
    const summary = await FacultyAttendance.aggregate([
      {
        $group: {
          _id: "$teacher",
          present: {
            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] },
          },
          leave: {
            $sum: { $cond: [{ $eq: ["$status", "LEAVE"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "faculties",
          localField: "_id",
          foreignField: "_id",
          as: "faculty",
        },
      },
      { $unwind: "$faculty" },
      {
        $project: {
          facultyName: "$faculty.name",
          teacherId: "$faculty.teacherId",
          present: 1,
          absent: 1,
          leave: 1,
        },
      },
    ]);

    res.status(200).json(summary);
  } catch (error) {
    console.error("Faculty presence error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
