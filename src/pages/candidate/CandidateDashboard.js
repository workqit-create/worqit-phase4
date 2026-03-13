// src/pages/candidate/CandidateDashboard.js
// ═══════════════════════════════════════════════════════
//  ULTRA-PREMIUM REBUILD (STITCH REFERENCE)
//  + OFFICIAL LOGO INTEGRATION
//  + Terminology: Terminate Session → Sign Out
//  + Top Navigation Utility: Feed, Applications, Insights
//  + Refined Color Grading & Spacing
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { getUserConversations } from "../../services/messageService";
import NotificationDropdown from "../../components/NotificationDropdown";
import { subscribeToNotifications } from "../../services/notificationService";
import { requestPushPermission } from "../../services/pushNotificationService";
import { LOGO_HORIZ } from "../../assets/logos";

import CandidateFeed from "./Feed";
import CandidateApplications from "./Applications";
import CandidateNetwork from "./Network";
import CandidateMessages from "./Messages";
import CandidateProfile from "./CandidateProfile";
import DocumentVault from "./DocumentVault";
import JobAlerts from "./JobAlerts";
import CandidateAnalytics from "./Analytics";

export default function CandidateDashboard() {
  const { userProfile, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) requestPushPermission(currentUser.uid);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    async function u() {
      try { const c = await getUserConversations(currentUser.uid); setUnread(c.reduce((s, x) => s + (x.myUnread || 0), 0)); } catch { }
    }
    u(); const iv = setInterval(u, 15000); return () => clearInterval(iv);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, (notifs) => {
      setUnreadNotifs(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser]);

  const activePath = location.pathname.replace(/^\/candidate\/?/, "").split("/")[0] || "";
  const initials = (userProfile?.name || "C").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // ── Ultra-Premium Style System ──
  const S = {
    shell: {
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1D1D1F",
      background: `radial-gradient(at 0% 0%, rgba(0, 85, 255, 0.04) 0px, transparent 50%),
                   radial-gradient(at 100% 100%, rgba(245, 166, 35, 0.03) 0px, transparent 50%),
                   #fcfcfd`,
    },
    header: {
      height: "90px", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", zIndex: 100, flexShrink: 0,
      background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
    },
    logoArea: { display: "flex", alignItems: "center", gap: "40px" },
    logo: { height: "32px", width: "auto", cursor: "pointer", transition: "transform 0.3s ease" },
    topNav: { display: "flex", alignItems: "center", gap: "8px", marginLeft: "20px" },
    topLink: (active) => ({
      padding: "8px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 700,
      color: active ? "#0055FF" : "#6E6E73", textDecoration: "none", transition: "all 0.2s",
      background: active ? "rgba(0, 85, 255, 0.06)" : "transparent",
    }),
    searchWrap: { position: "relative", width: "400px" },
    searchInput: {
      width: "100%", background: "#fff", border: "1px solid #E2E8F0",
      borderRadius: "14px", padding: "10px 16px 10px 44px", fontSize: "13px", fontWeight: 600,
      outline: "none", transition: "all 0.3s ease",
    },
    headerActions: { display: "flex", alignItems: "center", gap: "24px" },
    actionBtn: {
      width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", cursor: "pointer",
      color: "#6E6E73", transition: "all 0.2s"
    },
    notifDot: {
      position: "absolute", top: "10px", right: "10px", width: "10px", height: "10px",
      background: "#0055FF", borderRadius: "50%", border: "2px solid #fff",
      boxShadow: "0 0 12px rgba(0, 85, 255, 0.5)"
    },
    profileSection: {
      display: "flex", alignItems: "center", gap: "16px", paddingLeft: "24px",
      borderLeft: "1px solid rgba(0,0,0,0.08)"
    },
    avatar: {
      width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #0055FF, #00AAFF)",
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      fontWeight: 900, fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 85, 255, 0.2)"
    },
    body: { display: "flex", flex: 1, overflow: "hidden" },
    sidebar: {
      width: "300px", background: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(12px)",
      borderRight: "1px solid rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column",
      padding: "32px 24px"
    },
    main: { flex: 1, overflowY: "auto", padding: "48px 64px", scrollBehavior: "smooth" },
    sideHeading: { fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2.5px", color: "#94A3B8", marginBottom: "16px", paddingLeft: "12px" },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
      borderRadius: "12px", cursor: "pointer", transition: "all 0.3s",
      color: active ? "#0055FF" : "#6E6E73",
      fontWeight: active ? 800 : 600, fontSize: "14px",
      background: active ? "rgba(0, 85, 255, 0.08)" : "transparent",
      marginBottom: "2px"
    }),
    statusCard: {
      padding: "24px", borderRadius: "24px", background: "#1D1D1F", color: "#fff",
      boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)", position: "relative",
      overflow: "hidden", marginTop: "auto", marginBottom: "24px"
    },
    signoutBtn: {
      width: "100%", marginTop: "12px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)",
      color: "#6E6E73", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
      letterSpacing: "1.5px", padding: "12px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s"
    }
  };

  return (
    <div style={S.shell}>
      {/* TOP NAVIGATION */}
      <header style={S.header}>
        <div style={S.logoArea}>
          <img 
            src={LOGO_HORIZ} 
            alt="Worqit" 
            style={S.logo} 
            onClick={() => navigate("/candidate")}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
          
          <nav style={S.topNav}>
            <Link to="/candidate" style={S.topLink(activePath === "")}>Explore</Link>
            <Link to="/candidate/applications" style={S.topLink(activePath === "applications")}>My Applications</Link>
            <Link to="/candidate/analytics" style={S.topLink(activePath === "analytics")}>Growth</Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div style={S.searchWrap}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "18px" }}>search</span>
            <input 
              style={S.searchInput} 
              placeholder="Search opportunities or elite networks..." 
              type="text" 
              onFocus={e => { e.currentTarget.style.borderColor = "#0055FF"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0,85,255,0.05)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div style={S.headerActions}>
            <button style={S.actionBtn} onClick={() => navigate("/candidate/messages")} title="Messages">
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
            <button style={{ ...S.actionBtn, position: "relative" }} onClick={() => setShowNotifs(!showNotifs)} title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              {unreadNotifs > 0 && <div style={S.notifDot} />}
              {showNotifs && (
                <div style={{ position: "absolute", top: "54px", right: 0, zIndex: 200, width: "350px" }}>
                  <NotificationDropdown userId={currentUser?.uid} onClose={() => setShowNotifs(false)} />
                </div>
              )}
            </button>
            <button style={S.actionBtn} onClick={() => navigate("/candidate/profile")} title="Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>

          <div style={S.profileSection}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, margin: 0 }}>{userProfile?.name || "Professional"}</p>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#0055FF", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>Elite Seeker</p>
            </div>
            <div style={S.avatar} onClick={() => navigate("/candidate/profile")}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div style={S.body}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={{ flex: 1 }}>
            <div style={S.sideHeading}>Discovery</div>
            {[
              { path: "", label: "Opportunity Feed", icon: "explore" },
              { path: "applications", label: "My Applications", icon: "assignment_turned_in" },
              { path: "network", label: "Elite Network", icon: "hub" },
              { path: "messages", label: "Direct Messages", icon: "chat_bubble", badge: unread },
              { path: "alerts", label: "Job Alerts", icon: "notifications_active" },
              { path: "analytics", label: "Growth Insights", icon: "analytics" },
              { path: "documents", label: "Document Vault", icon: "folder_open" },
              { path: "profile", label: "Elite Profile", icon: "account_circle" },
            ].map(item => (
              <div key={item.path} onClick={() => navigate(`/candidate/${item.path}`)} style={S.navItem(activePath === item.path)}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background: "#0055FF", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "2px 8px", borderRadius: "10px" }}>{item.badge}</span>}
              </div>
            ))}
          </div>

          <div style={S.statusCard}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "100px", height: "100px", background: "rgba(0,85,255,0.1)", borderRadius: "50%", marginRight: "-50px", marginTop: "-50px" }} />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>Elite Profile</h4>
            <p style={{ fontSize: "10px", color: "#94A3B8", margin: "0 0 16px" }}>Your visibility is at 84%</p>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "84%", height: "100%", background: "#0055FF" }} />
            </div>
          </div>

          <button 
            onClick={logout} 
            style={S.signoutBtn}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,50,50,0.05)"; e.currentTarget.style.color = "#E53E3E"; e.currentTarget.style.borderColor = "rgba(220,50,50,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = "#6E6E73"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.05)"; }}
          >
            Sign Out
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main style={S.main}>
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
        </main>
      </div>
    </div>
  );
}
