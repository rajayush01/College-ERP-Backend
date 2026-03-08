import express from "express";

import { publishResults } from "../../controllers/admin/examPublish.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

router.post("/:examId/publish", protect, isAdmin, publishResults);

export default router;
