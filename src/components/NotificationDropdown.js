// src/components/NotificationDropdown.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToNotifications, markAsRead, markAllAsRead } from "../services/notificationService";
import { C } from "../pages/shared/theme";

const getIcon = (type) => {
    switch (type) {
        case "profile_view": return "👀";
        case "message": return "💬";
        case "application_status": return "📋";
        case "connection": return "🤝";
        default: return "🔔";
    }
};

export default function NotificationDropdown({ userId, onClose, className }) {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!userId) return;
        const unsubscribe = subscribeToNotifications(userId, (notifs) => {
            setNotifications(notifs);
        });
        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleNotificationClick = async (notif) => {
        // Stop propagation to prevent immediate closing before action finishes, if needed
        if (!notif.read) {
            await markAsRead(notif.id);
        }
        if (notif.link) {
            navigate(notif.link);
        }
        onClose();
    };

    const handleMarkAll = async (e) => {
        e.stopPropagation();
        await markAllAsRead(userId);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div
            className={className}
            ref={dropdownRef}
            style={{
                position: "absolute",
                top: "100%",
                marginTop: 8,
                right: 0,
                width: 340,
                maxHeight: 400,
                background: C.ink2,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: C.font
            }}
        >
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 700 }}>Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        style={{ background: "transparent", border: "none", color: C.cyan, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 30, textAlign: "center", color: C.silver, fontSize: 13 }}>
                        No notifications yet.
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                                padding: "12px 16px",
                                borderBottom: `1px solid ${C.line}`,
                                background: n.read ? "transparent" : "rgba(26,111,232,.1)",
                                display: "flex",
                                gap: 12,
                                cursor: "pointer",
                                transition: "background 0.2s"
                            }}
                        >
                            <div style={{ fontSize: 20, flexShrink: 0 }}>
                                {getIcon(n.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: 13, marginBottom: 4, lineHeight: 1.4 }}>
                                    {n.content}
                                </div>
                                <div style={{ color: C.silver, fontSize: 11 }}>
                                    {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                                </div>
                            </div>
                            {!n.read && (
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan, alignSelf: "center", marginLeft: "auto", flexShrink: 0 }} />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
