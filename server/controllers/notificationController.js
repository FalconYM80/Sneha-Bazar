import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import { registerClient } from "../services/notificationService.js";

/**
 * SSE Stream endpoint for real-time order notifications
 * Protected by admin authentication
 */
export const streamNotifications = (req, res) => {
  const admin = req.admin;
  const clientId = `${admin._id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  registerClient(clientId, req, res, admin);
};

/**
 * Get recent notifications with persistent read/unread state and total unread count
 * Supports pagination or limit (defaults to 30)
 */
export const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

    // Optional self-healing: if notification collection is empty, sync recent pending/recent orders
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(20);

      for (const order of recentOrders) {
        await Notification.findOneAndUpdate(
          { order: order._id },
          {
            $setOnInsert: {
              type: "new_order",
              order: order._id,
              orderNumber: order.orderNumber,
              customerName: order.customerName || "Customer",
              totalAmount: order.totalAmount || 0,
              totalItemCount: order.totalItemCount || order.items?.length || 1,
              isRead: false,
              createdAt: order.createdAt,
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving notifications",
    });
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      unreadCount,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error marking notification as read",
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
      data: {
        modifiedCount: result?.modifiedCount || 0,
        unreadCount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error marking all notifications as read",
    });
  }
};

/**
 * Get current unread notification count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving unread count",
    });
  }
};
