import express from "express";
import { getAllSubjects, createSubject, deleteSubject } from "../../controllers/admin/subject.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/", getAllSubjects);
router.post("/", createSubject);
router.delete("/:id", deleteSubject);

export default router;
