import express from "express";
import {
  raiseRequest,
  getMyRequests,
} from "../../controllers/student/request.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Raise a request
router.post("/", protect, raiseRequest);

// View own requests
router.get("/my", protect, getMyRequests);

export default router;
