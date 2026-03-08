import express from "express";
import {
  getMyBatchTimetable,
  getMyTimetableDocuments,
} from "../../controllers/teacher/timetable.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/timetable-documents",
  protect,
  getMyTimetableDocuments
);

router.get(
  "/:batchId",
  protect,
  getMyBatchTimetable
);

export default router;
