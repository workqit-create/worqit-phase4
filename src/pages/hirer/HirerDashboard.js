// src/pages/hirer/HirerDashboard.js — Phase 4: routing fix + Founding100
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { LOGO_HORIZ } from "../../assets/logos";
import { getUserConversations } from "../../services/messageService";
import NotificationDropdown from "../../components/NotificationDropdown";
import { subscribeToNotifications } from "../../services/notificationService";
import { requestPushPermission } from "../../services/pushNotificationService";

import HirerPostJob from "./PostJob";
import HirerMyJobs from "./MyJobs";
import HirerDiscover from "./Discover";
import HirerMessages from "./HirerMessages";
import HirerProfile from "./HirerProfile";
import Founding100 from "./Founding100";
import DocumentTracker from "./DocumentTracker";
import ComplianceTemplates from "./ComplianceTemplates";
import Billing from "./Billing";
import HirerAnalytics from "./Analytics";

const NAV = [
  { path: "", label: "Post a Job", icon: "✏️" },
  { path: "jobs", label: "My Jobs", icon: "💼" },
  { path: "discover", label: "Discover", icon: "🔍" },
  { path: "documents", label: "Documents", icon: "📁" },
  { path: "templates", label: "Templates", icon: "📄" },
  { path: "founding", label: "Founding 100", icon: "🏆" },
  { path: "analytics", label: "Insights", icon: "📈" },
  { path: "billing", label: "Plans & Billing", icon: "💳" },
  { path: "profile", label: "Profile", icon: "🏢" },
];

export default function HirerDashboard() {
  const { userProfile, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  // Request Push Notification Permission
  useEffect(() => {
    if (currentUser?.uid) {
      requestPushPermission(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    async function u() {
      try { const c = await getUserConversations(currentUser.uid); setUnread(c.reduce((s, x) => s + (x.myUnread || 0), 0)); } catch { }
    }
    u(); const iv = setInterval(u, 15000); return () => clearInterval(iv);
  }, [currentUser]);

  // Notifications
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, (notifs) => {
      setUnreadNotifs(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser]);

  // Fix: strip /hirer/ prefix correctly
  const seg = location.pathname.replace(/^\/hirer\/?/, "").split("/")[0] || "";
  const initials = (userProfile?.companyName || userProfile?.name || "H").charAt(0).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.ink, fontFamily: C.font }}>
      {/* SIDEBAR */}
      <div style={{ width: 280, borderRight: `1px solid ${C.line}`, background: C.ink, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }} className="wq-sidebar">
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_HORIZ} alt="Worqit" style={{ height: 36, width: "auto" }} />
          <div style={{ marginLeft: "auto", cursor: "pointer", position: "relative" }} onClick={() => setShowNotifs(!showNotifs)}>
            <span style={{ fontSize: 20 }}>🔔</span>
            {unreadNotifs > 0 && (
              <span style={{ position: "absolute", top: -4, right: -8, background: C.grad, borderRadius: "100px", padding: "1px 5px", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
            {showNotifs && (
              <div style={{ position: "absolute", top: 30, left: 30 }} onClick={e => e.stopPropagation()}>
                <NotificationDropdown
                  userId={currentUser?.uid}
                  onClose={() => setShowNotifs(false)}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "10px 16px 0" }}>
          <div style={{ background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.25)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: C.cyan, display: "inline-flex", alignItems: "center", gap: 6 }}>
            🏢 Hirer Account
            {userProfile?.isFounding100 && <span style={{ background: "rgba(255,170,0,.2)", border: "1px solid rgba(255,170,0,.4)", borderRadius: 4, padding: "1px 6px", color: "#FFAA00", fontSize: 10 }}>Founding 100</span>}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(item => {
            const active = seg === item.path;
            return (
              <div key={item.path} onClick={() => navigate(`/hirer/${item.path}`)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "all .15s", background: active ? "rgba(26,111,232,.15)" : "transparent", border: active ? "1px solid rgba(26,111,232,.25)" : "1px solid transparent", color: active ? "#fff" : C.silver, fontWeight: active ? 700 : 500, fontSize: 14 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
                {item.path === "messages" && unread > 0 && <span style={{ marginLeft: "auto", background: C.grad, borderRadius: 100, padding: "1px 7px", fontSize: 11, fontWeight: 700, color: "#fff" }}>{unread > 9 ? "9+" : unread}</span>}
                {item.path === "founding" && userProfile?.isFounding100 && <span style={{ marginLeft: "auto", fontSize: 14 }}>🏆</span>}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0 }}>{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userProfile?.companyName || userProfile?.name || "Hirer"}</div>
              <div style={{ color: C.silver, fontSize: 11 }}>Company</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: "100%", background: "rgba(255,255,255,.04)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 0", color: C.silver, fontSize: 13, cursor: "pointer", fontFamily: C.font, fontWeight: 600 }}>Sign Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: "auto" }} className="wq-main-content">
        <Routes>
          <Route path="/" element={<HirerPostJob />} />
          <Route path="/jobs" element={<HirerMyJobs />} />
          <Route path="/discover" element={<HirerDiscover />} />
          <Route path="/messages" element={<HirerMessages />} />
          <Route path="/documents" element={<DocumentTracker />} />
          <Route path="/templates" element={<ComplianceTemplates />} />
          <Route path="/founding" element={<Founding100 />} />
          <Route path="/analytics" element={<HirerAnalytics />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/profile" element={<HirerProfile />} />
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
        {NAV.filter(n => ["jobs", "discover", "messages", "profile"].includes(n.path)).map(item => {
          const active = seg === item.path;
          return (
            <div
              key={item.path}
              onClick={() => navigate(`/hirer/${item.path}`)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: active ? "#fff" : C.silver, padding: "8px 12px", borderRadius: 8,
                position: "relative", cursor: "pointer"
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              {item.path === "messages" && unread > 0 && (
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
