import { useState, useRef, useEffect } from "react";
import { IconBell } from "./ui";
import { useNotifications } from "../contexts/NotificationContext";
import type { Page } from "../types";

interface NotificationDropdownProps {
  onNavigate?: (page: Page, target?: { search?: string; id?: string }) => void;
}

function formatRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function NotificationDropdown({ onNavigate }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isSoundMuted,
    toggleSoundMuted,
    markAsRead,
    markAllAsRead,
    hasBrowserPermission,
    requestBrowserPermission,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    if (!notif.isRead && notif._id) {
      markAsRead(notif._id);
    }
    setOpen(false);
    if (onNavigate) {
      onNavigate("orders", {
        id: notif.order,
        search: notif.orderNumber,
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        <IconBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown Menu */}
      {open && (
        <div className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 py-0 z-50 overflow-hidden animate-in fade-in-50 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Sound Mute/Unmute Toggle */}
              <button
                onClick={toggleSoundMuted}
                title={isSoundMuted ? "Unmute notification sound" : "Mute notification sound"}
                aria-label={isSoundMuted ? "Unmute sound" : "Mute sound"}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSoundMuted
                    ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    : "text-green-600 hover:bg-green-50"
                }`}
              >
                {isSoundMuted ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>

              {/* Mark All As Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Desktop Notification Banner Prompt if permission not granted */}
          {!hasBrowserPermission && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
            <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-emerald-800 text-[11px]">Enable browser desktop alerts?</span>
              <button
                onClick={requestBrowserPermission}
                className="text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                  <IconBell size={22} />
                </div>
                <p className="text-xs font-bold text-gray-700">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  You will be notified here immediately when new customer orders are placed.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={notif._id || notif.order}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-start gap-3 hover:bg-gray-50 ${
                      isUnread ? "bg-emerald-50/30" : "bg-white"
                    }`}
                  >
                    {/* Unread indicator / icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {isUnread ? (
                        <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent mt-1.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded tracking-wide uppercase">
                          New Order
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-2 mt-1">
                        <p className={`text-xs truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          Order #{notif.orderNumber}
                        </p>
                        <span className={`text-xs flex-shrink-0 ${isUnread ? "font-bold text-green-700" : "font-semibold text-gray-800"}`}>
                          ₹{notif.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-gray-500 truncate">
                          {notif.customerName || "Customer"} • {notif.totalItemCount || 1} {notif.totalItemCount === 1 ? "item" : "items"}
                        </p>
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif._id);
                            }}
                            title="Mark as read"
                            className="text-[10px] text-gray-400 hover:text-green-600 font-medium cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Showing recent {notifications.length} orders</span>
              {onNavigate && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onNavigate("orders");
                  }}
                  className="font-semibold text-green-600 hover:text-green-700 cursor-pointer"
                >
                  View all orders &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
