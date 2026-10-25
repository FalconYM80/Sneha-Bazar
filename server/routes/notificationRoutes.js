import express from "express";
import {
  streamNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification endpoints are restricted to authenticated administrators
router.use(protect);

// Real-time Server-Sent Events stream for new orders
router.get("/stream", streamNotifications);

// Fetch recent notifications with unread count
router.get("/", getNotifications);

// Get current unread notification count
router.get("/unread-count", getUnreadCount);

// Mark single notification as read
router.patch("/:id/read", markAsRead);

// Mark all unread notifications as read
router.patch("/mark-all-read", markAllAsRead);

export default router;
