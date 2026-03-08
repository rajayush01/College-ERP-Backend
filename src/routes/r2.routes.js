console.log("✅ r2.routes.js loaded");

import express from "express";
import { getR2UploadUrl } from "../controllers/r2.controller.js";
import {protect} from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Generate presigned R2 upload URL
 * Used by: assignments, documents, timetables, etc.
 */
router.post(
  "/upload-url",
  protect,      // ensure logged-in user
  getR2UploadUrl
);

export default router;
