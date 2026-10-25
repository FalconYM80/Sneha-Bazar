import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  api,
  type OrderNotification,
} from "../services/api";
import { useAuth } from "./AuthContext";
import {
  playOrderNotificationSound,
  getSoundMuted,
  setSoundMuted,
  requestDesktopNotificationPermission,
  showDesktopNotification,
} from "../utils/audio";

interface NotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  isLoading: boolean;
  isSoundMuted: boolean;
  toggleSoundMuted: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestBrowserPermission: () => Promise<void>;
  hasBrowserPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMutedState] = useState<boolean>(() => getSoundMuted());
  const [hasBrowserPermission, setHasBrowserPermission] = useState<boolean>(() => {
    return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
  });

  // Track known order IDs to deduplicate incoming events
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleSoundMuted = useCallback(() => {
    setIsSoundMutedState((prev) => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    const permission = await requestDesktopNotificationPermission();
    setHasBrowserPermission(permission === "granted");
  }, []);

  // Fetch recent notifications from server
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.notifications.getAll(30);
      if (res?.data) {
        setNotifications(res.data);
        setUnreadCount(typeof res.unreadCount === "number" ? res.unreadCount : 0);
        const orderIds = new Set<string>();
        res.data.forEach((n) => {
          if (n.order) orderIds.add(n.order.toString());
          if (n._id) orderIds.add(n._id.toString());
        });
        knownOrderIdsRef.current = orderIds;
      }
    } catch (err) {
      console.debug("[Notifications] Failed to load notifications:", err);
    }
  }, [isAuthenticated]);

  // Handle incoming new order notification
  const handleIncomingNotification = useCallback((incoming: OrderNotification) => {
    if (!incoming || (!incoming._id && !incoming.order)) return;

    const orderKey = (incoming.order || incoming._id).toString();
    const isAlreadyKnown = knownOrderIdsRef.current.has(orderKey);

    setNotifications((prev) => {
      // Find if already in list by unique order ID or _id
      const existingIdx = prev.findIndex(
        (n) => (n.order && incoming.order && n.order.toString() === incoming.order.toString()) ||
               (n._id && incoming._id && n._id.toString() === incoming._id.toString())
      );

      if (existingIdx !== -1) {
        // Already exists: update in place without re-alerting
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...incoming };
        return copy;
      }

      // Genuinely new order!
      knownOrderIdsRef.current.add(orderKey);
      if (incoming._id) {
        knownOrderIdsRef.current.add(incoming._id.toString());
      }

      // Play audio chime and trigger desktop notification only for new orders
      playOrderNotificationSound();
      showDesktopNotification(`New Order #${incoming.orderNumber}`, {
        body: `${incoming.customerName || "Customer"} placed an order for ₹${incoming.totalAmount}`,
      });

      return [incoming, ...prev];
    });

    if (!isAlreadyKnown && !incoming.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.notifications.markAsRead(id);
    } catch (err) {
      console.error("[Notifications] Failed to mark as read:", err);
      // Re-sync on failure
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.notifications.markAllAsRead();
    } catch (err) {
      console.error("[Notifications] Failed to mark all as read:", err);
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Lifecycle: setup SSE + fallback polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up when unauthenticated
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      knownOrderIdsRef.current.clear();
      return;
    }

    setIsLoading(true);
    refreshNotifications().finally(() => setIsLoading(false));

    // Connect to Server-Sent Events stream
    let es: EventSource | null = null;
    try {
      const streamUrl = api.notifications.getStreamUrl();
      es = new EventSource(streamUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.addEventListener("new_order", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingNotification(data);
        } catch (err) {
          console.debug("[SSE] Parse error:", err);
        }
      });

      es.onerror = () => {
        // EventSource will automatically retry connecting.
        // Fallback polling ensures orders are not missed during reconnects.
      };
    } catch (err) {
      console.debug("[SSE] EventSource initialization failed:", err);
    }

    // Lightweight fallback polling every 25 seconds
    pollTimerRef.current = setInterval(() => {
      refreshNotifications();
    }, 25000);

    return () => {
      if (es) {
        es.close();
        eventSourceRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isAuthenticated, refreshNotifications, handleIncomingNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isSoundMuted,
        toggleSoundMuted,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        requestBrowserPermission,
        hasBrowserPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
