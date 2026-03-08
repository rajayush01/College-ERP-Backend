import express from "express";
import { teacherLogin } from "../../controllers/teacher/auth.controller.js";

const router = express.Router();

// Teacher login
router.post("/login", teacherLogin);

export default router;
