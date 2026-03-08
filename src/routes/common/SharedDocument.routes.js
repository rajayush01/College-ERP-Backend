import express from "express";
import { getSharedDocuments } from "../../controllers/common/SharedDocument.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getSharedDocuments);

export default router;
