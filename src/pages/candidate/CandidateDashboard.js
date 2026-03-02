// src/pages/candidate/CandidateDashboard.js
// ═══════════════════════════════════════════════════════
//  Candidate shell — nav + sub-routing
//  Replaces the ComingSoon placeholder in App.js
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { LOGO_HORIZ } from "../../assets/logos";
import { getUserConversations } from "../../services/messageService";
import NotificationDropdown from "../../components/NotificationDropdown";
import { subscribeToNotifications } from "../../services/notificationService";
import { requestPushPermission } from "../../services/pushNotificationService";

import CandidateFeed from "./Feed";
import CandidateApplications from "./Applications";
import CandidateNetwork from "./Network";
import CandidateMessages from "./Messages";
import CandidateProfile from "./CandidateProfile";
import DocumentVault from "./DocumentVault";
import JobAlerts from "./JobAlerts";
import CandidateAnalytics from "./Analytics";

const NAV_ITEMS = [
  { path: "", label: "Feed", icon: "🔍" },
  { path: "applications", label: "Applications", icon: "📋" },
  { path: "network", label: "Network", icon: "🤝" },
  { path: "messages", label: "Messages", icon: "💬" },
  { path: "alerts", label: "Job Alerts", icon: "🔔" },
  { path: "analytics", label: "Insights", icon: "📈" },
  { path: "documents", label: "Documents", icon: "📁" },
  { path: "profile", label: "Profile", icon: "👤" },
];

export default function CandidateDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  // Request Push Notification Permission
  useEffect(() => {
    if (currentUser?.uid) {
      requestPushPermission(currentUser.uid);
    }
  }, [currentUser]);

  // Poll unread count
  useEffect(() => {
    if (!currentUser) return;
    async function fetchUnread() {
      try {
        const convs = await getUserConversations(currentUser.uid);
        setUnread(convs.reduce((sum, c) => sum + (c.myUnread || 0), 0));
      } catch { }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Notifications
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, (notifs) => {
      setUnreadNotifs(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser]);

  const activePath = location.pathname.split("/candidate/")[1] || "";

  const S = {
    shell: { display: "flex", minHeight: "100vh", background: C.ink, fontFamily: C.font },
    sidebar: {
      width: 240, flexShrink: 0, background: C.ink2,
      borderRight: `1px solid ${C.line}`,
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh",
    },
    logoArea: {
      padding: "20px 20px 16px",
      borderBottom: `1px solid ${C.line}`,
      display: "flex", alignItems: "center", gap: 10,
    },
    nav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 10,
      cursor: "pointer", transition: "all .15s",
      background: active ? "rgba(26,111,232,.15)" : "transparent",
      border: active ? "1px solid rgba(26,111,232,.25)" : "1px solid transparent",
      color: active ? "#fff" : C.silver,
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      textDecoration: "none",
      position: "relative",
    }),
    badge: {
      marginLeft: "auto",
      background: C.grad,
      borderRadius: "100px",
      padding: "1px 7px",
      fontSize: 11,
      fontWeight: 700,
      color: "#fff",
    },
    notifBadge: {
      position: "absolute",
      top: -4,
      right: -8,
      background: C.grad,
      borderRadius: "100px",
      padding: "1px 5px",
      fontSize: 10,
      fontWeight: 700,
      color: "#fff",
    },
    bottom: { padding: "16px 12px", borderTop: `1px solid ${C.line}` },
    userInfo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
    avatar: {
      width: 34, height: 34, borderRadius: "50%",
      background: C.grad, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0,
    },
    main: { flex: 1, overflow: "auto" },

    // Mobile top bar
    mobileBar: {
      display: "none",
      position: "sticky", top: 0, zIndex: 100,
      background: C.ink2, borderBottom: `1px solid ${C.line}`,
      padding: "0 16px", height: 56,
      alignItems: "center", justifyContent: "space-between",
    },
  };

  const initials = (userProfile?.name || "C").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={S.shell}>
      {/* SIDEBAR */}
      <div style={S.sidebar} className="wq-sidebar">
        <div style={S.logoArea}>
          <img src={LOGO_HORIZ} alt="Worqit" style={{ height: 36, width: "auto" }} />
          <div style={{ marginLeft: "auto", cursor: "pointer", position: "relative" }} onClick={() => setShowNotifs(!showNotifs)}>
            <span style={{ fontSize: 20 }}>🔔</span>
            {unreadNotifs > 0 && <span style={S.notifBadge}>{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>}
            {showNotifs && (
              <div style={{ position: "absolute", top: 30, left: 30 }} onClick={e => e.stopPropagation()}>
                <NotificationDropdown
                  userId={currentUser?.uid}
                  onClose={() => setShowNotifs(false)}
                  className="wq-notif-dropdown"
                />
              </div>
            )}
          </div>
        </div>

        <nav style={S.nav}>
          {NAV_ITEMS.map(item => {
            const isActive = activePath === item.path || (item.path === "" && activePath === "");
            const isMessages = item.path === "messages";
            return (
              <div
                key={item.path}
                style={S.navItem(isActive)}
                onClick={() => navigate(`/candidate/${item.path}`)}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
                {isMessages && unread > 0 && (
                  <span style={S.badge}>{unread > 9 ? "9+" : unread}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div style={S.bottom}>
          <div style={S.userInfo}>
            <div style={S.avatar}>{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userProfile?.name || "Candidate"}
              </div>
              <div style={{ color: C.silver, fontSize: 11 }}>Job Seeker</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", background: "rgba(255,255,255,.04)",
              border: `1px solid ${C.line}`, borderRadius: 8,
              padding: "8px 0", color: C.silver, fontSize: 13,
              cursor: "pointer", fontFamily: C.font, fontWeight: 600,
            }}
          >Sign Out</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={S.main} className="wq-main-content">
        <Routes>
          <Route path="/" element={<CandidateFeed />} />
          <Route path="/applications" element={<CandidateApplications />} />
          <Route path="/network" element={<CandidateNetwork />} />
          <Route path="/messages" element={<CandidateMessages />} />
          <Route path="/messages/:convId" element={<CandidateMessages />} />
          <Route path="/alerts" element={<JobAlerts />} />
          <Route path="/analytics" element={<CandidateAnalytics />} />
          <Route path="/documents" element={<DocumentVault />} />
          <Route path="/profile" element={<CandidateProfile />} />
        </Routes>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="wq-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(6,12,26,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.line}`,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "8px 0", paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        zIndex: 999
      }}>
        {NAV_ITEMS.filter(n => ["", "messages", "alerts", "profile"].includes(n.path)).map(item => {
          const isActive = activePath === item.path || (item.path === "" && activePath === "");
          const isMessages = item.path === "messages";
          return (
            <div
              key={item.path}
              onClick={() => navigate(`/candidate/${item.path}`)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: isActive ? "#fff" : C.silver, padding: "8px 12px", borderRadius: 8,
                position: "relative"
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              {isMessages && unread > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 6,
                  background: C.red, color: "#fff", fontSize: 10, fontWeight: 800,
                  minWidth: 16, height: 16, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px"
                }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .wq-bottom-nav { display: none !important; }

        @media(max-width:768px){
          .wq-sidebar { display: none !important; }
          .wq-bottom-nav { display: flex !important; }
          .wq-main-content { padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </div>
  );
}
