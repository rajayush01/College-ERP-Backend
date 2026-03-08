import express from "express";
import {
  createFeeStructure,
  getAllFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  getClassesForFeeStructure,
} from "../../controllers/admin/feeStructure.controller.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from '../../middlewares/multerUpload.js';

const router = express.Router();

// Fee Structure Routes
router.post("/", protect, isAdmin, upload.single('feeStructureDocument'), createFeeStructure);
router.get("/", protect, isAdmin, getAllFeeStructures);
router.get("/classes", protect, isAdmin, getClassesForFeeStructure);
router.get("/:id", protect, isAdmin, getFeeStructureById);
router.put("/:id", protect, isAdmin, upload.single('feeStructureDocument'), updateFeeStructure);
router.delete("/:id", protect, isAdmin, deleteFeeStructure);

export default router;
