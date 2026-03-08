import express from "express";
import requestController from "../../controllers/admin/request.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

router.get("/", protect, isAdmin, requestController.getAllRequests);
router.post("/:requestId/approve", protect, isAdmin, requestController.approveRequest);
router.post("/:requestId/reject", protect, isAdmin, requestController.rejectRequest);

export default router;
