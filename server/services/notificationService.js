import Notification from "../models/Notification.js";

// Active SSE clients: clientId -> { res, adminId, heartbeatTimer }
const clients = new Map();

/**
 * Register an authenticated SSE client connection.
 * Sets appropriate streaming headers, sends initial status, and maintains heartbeats.
 */
export const registerClient = (clientId, req, res, admin) => {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disables response buffering in Nginx/Render reverse proxies
  });

  // Flush headers if supported
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  // Send initial connection acknowledgement event
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "Notification stream established",
      timestamp: Date.now(),
    })}\n\n`
  );

  // Maintain heartbeat every 25 seconds to prevent Render reverse proxy from closing the idle socket
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeatTimer);
      clients.delete(clientId);
    }
  }, 25000);

  // Store client
  clients.set(clientId, {
    res,
    adminId: admin._id?.toString(),
    heartbeatTimer,
  });

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(heartbeatTimer);
    clients.delete(clientId);
  });
};

/**
 * Create a persistent notification in MongoDB and broadcast it in real time to all active admins.
 * Uses order ID as unique key to prevent duplicate notifications even if called multiple times.
 */
export const createAndBroadcastOrderNotification = async (order) => {
  try {
    if (!order || !order._id || !order.orderNumber) {
      return null;
    }

    // Persist to MongoDB (upsert guarantees exactly 1 notification per order)
    const notification = await Notification.findOneAndUpdate(
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
          createdAt: order.createdAt || new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Format SSE payload
    const sseMessage = `event: new_order\ndata: ${JSON.stringify(notification)}\n\n`;

    // Broadcast to all active admin clients
    for (const [clientId, client] of clients.entries()) {
      try {
        client.res.write(sseMessage);
      } catch (err) {
        clearInterval(client.heartbeatTimer);
        clients.delete(clientId);
      }
    }

    return notification;
  } catch (error) {
    console.error("[Notification Service] Error broadcasting new order notification:", error.message);
    return null;
  }
};

/**
 * Get count of active connected SSE admin clients
 */
export const getActiveClientCount = () => {
  return clients.size;
};
