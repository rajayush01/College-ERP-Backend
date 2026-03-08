import express from "express";
import { studentLogin } from "../../controllers/student/auth.controller.js";

const router = express.Router();

// Student login
router.post("/login", studentLogin);

export default router;
