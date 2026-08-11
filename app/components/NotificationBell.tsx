"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getNotificationsAction, markNotificationsAsReadAction, markNotificationAsReadAction } from "@/app/actions/notifications";

type NotificationType = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ bottom: number; left: number }>({ bottom: 0, left: 0 });
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) ||
        (buttonRef.current && buttonRef.current.contains(event.target as Node))
      ) {
        return; // Clicked inside dropdown or on the toggle button
      }
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    async function loadNotifications() {
      const res = await getNotificationsAction();
      if (res.notifications) {
        setNotifications(res.notifications);
      }
    }
    loadNotifications();
  }, []);

  const handleMarkAsRead = async () => {
    await markNotificationsAsReadAction();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        bottom: window.innerHeight - rect.top + 8, // Place above the button
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={toggleDropdown}
        className="btn btn-ghost"
        style={{ 
          position: "relative",
          padding: "6px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          borderRadius: "50%"
        }}
        aria-label="Notifications"
      >
        <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            display: "flex",
            height: "10px",
            width: "10px",
            backgroundColor: "var(--urgent)",
            borderRadius: "50%",
            border: "2px solid var(--surface)"
          }} />
        )}
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: "fixed",
            bottom: dropdownStyle.bottom,
            left: dropdownStyle.left,
            width: "320px",
            backgroundColor: "var(--surface)",
            borderRadius: "8px",
            boxShadow: "var(--shadow)",
            border: "1px solid var(--border)",
            zIndex: 9999,
            overflow: "hidden"
          }}>
          <div style={{
            padding: "12px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--surface-2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>Notifications</h3>
            {unreadCount > 0 && (
              <span 
                style={{ fontSize: "12px", color: "var(--brand)", cursor: "pointer" }}
                onClick={handleMarkAsRead}
              >
                Mark all as read
              </span>
            )}
          </div>
          
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
                No new notifications.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    backgroundColor: n.isRead ? "transparent" : "var(--brand-soft)",
                    opacity: n.isRead ? 0.7 : 1,
                  }}
                  onClick={async () => {
                    if (!n.isRead) {
                      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
                      await markNotificationAsReadAction(n.id);
                    }
                    if (n.link) router.push(n.link);
                    setIsOpen(false);
                  }}
                >
                  <h4 style={{ 
                    fontSize: "14px", 
                    marginBottom: "4px", 
                    color: n.isRead ? "var(--text)" : "var(--ink)",
                    fontWeight: n.isRead ? 500 : 600
                  }}>
                    {n.title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", display: "block", textTransform: "uppercase" }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
