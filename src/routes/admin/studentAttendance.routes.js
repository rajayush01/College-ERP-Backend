// src/routes/admin/studentAttendance.routes.js
const express = require("express");
const router = express.Router();

const {
  viewStudentAttendance,
} = require("../../controllers/admin/studentAttendance.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { isAdmin } = require("../../middlewares/admin.middleware");

router.get("/", protect, isAdmin, viewStudentAttendance);

module.exports = router;
