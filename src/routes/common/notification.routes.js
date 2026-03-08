const express = require("express");
const router = express.Router();

const { pollNotifications,markAsRead } = require("../../controllers/common/notification.controller");

const { protect } = require("../../middlewares/auth.middleware");

router.get("/", protect, pollNotifications);
router.patch("/:notificationStatusId/read", protect, markAsRead);


module.exports = router;
