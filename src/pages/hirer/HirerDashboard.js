// src/pages/hirer/HirerDashboard.js
// ═══════════════════════════════════════════════════════
//  ULTRA-PREMIUM REBUILD (STITCH REFERENCE)
//  + OFFICIAL LOGO INTEGRATION
//  + Terminology: Terminate Session → Sign Out
//  + Top Navigation Utility: Home, Settings, Quick Stats
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
import { getHirerJobs } from "../../services/jobService";
import { LOGO_HORIZ } from "../../assets/logos";

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

export default function HirerDashboard() {
  const { userProfile, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      requestPushPermission(currentUser.uid);
      getHirerJobs(currentUser.uid).then(setJobs);
    }
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

  const activePath = location.pathname.replace(/^\/hirer\/?/, "").split("/")[0] || "";
  const initials = (userProfile?.companyName || userProfile?.name || "H").charAt(0).toUpperCase();

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
      boxShadow: "0 1px 0 rgba(255,255,255,0.8)",
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
    navItem: (active, gold) => ({
      display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
      borderRadius: "12px", cursor: "pointer", transition: "all 0.3s",
      color: active ? (gold ? "#D97706" : "#0055FF") : (gold ? "#F5A623" : "#6E6E73"),
      fontWeight: active ? 800 : 600, fontSize: "14px",
      background: active ? (gold ? "rgba(245, 166, 35, 0.08)" : "rgba(0, 85, 255, 0.08)") : "transparent",
      marginBottom: "2px"
    }),
    quickJob: (active) => ({
      padding: "16px", borderRadius: "14px", cursor: "pointer", transition: "all 0.2s",
      background: active ? "#fff" : "transparent",
      border: `1px solid ${active ? "rgba(0, 85, 255, 0.1)" : "transparent"}`,
      boxShadow: active ? "0 12px 24px -8px rgba(0, 0, 0, 0.05)" : "none",
      marginBottom: "12px"
    }),
    ctaBtn: {
      width: "100%", background: "#1D1D1F", color: "#fff", fontWeight: 800,
      padding: "14px", borderRadius: "14px", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "11px"
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
            onClick={() => navigate("/hirer")}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
          
          <nav style={S.topNav}>
            <Link to="/hirer" style={S.topLink(activePath === "")}>Overview</Link>
            <Link to="/hirer/analytics" style={S.topLink(activePath === "analytics")}>Analytics</Link>
            <Link to="/hirer/discover" style={S.topLink(activePath === "discover")}>Talent</Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div style={S.searchWrap}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "18px" }}>search</span>
            <input 
              style={S.searchInput} 
              placeholder="Search strategic roles or candidates..." 
              type="text" 
              onFocus={e => { e.currentTarget.style.borderColor = "#0055FF"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0,85,255,0.05)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div style={S.headerActions}>
            <button style={S.actionBtn} onClick={() => navigate("/hirer/messages")} title="Messages">
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
            <button style={S.actionBtn} onClick={() => navigate("/hirer/profile")} title="Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>

          <div style={S.profileSection}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, margin: 0 }}>{userProfile?.companyName || "Elevate Studio"}</p>
              <p style={{ fontSize: "9px", fontWeight: 900, color: "#0055FF", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>Enterprise Luxe</p>
            </div>
            <div style={S.avatar} onClick={() => navigate("/hirer/profile")}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div style={S.body}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingLeft: "12px" }}>
            <h3 style={{ ...S.sideHeading, marginBottom: 0 }}>Active Cycles</h3>
            <button onClick={() => navigate("/hirer")} style={{ background: "none", border: "none", color: "#0055FF", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add_circle</span>
            </button>
          </div>

          <div style={{ marginBottom: "32px" }}>
            {jobs.slice(0, 3).map((job, idx) => (
              <div key={job.id} onClick={() => navigate(`/hirer/jobs`)} style={S.quickJob(idx === 0)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: 0, color: idx === 0 ? "#1D1D1F" : "#6E6E73" }}>{job.title}</h4>
                  {idx === 0 && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0055FF", boxShadow: "0 0 8px #0055FF" }} />}
                </div>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                  {job.status === 'open' ? 'Live Listing' : 'Draft'}
                </p>
              </div>
            ))}
            {jobs.length === 0 && (
              <div style={{ padding: "20px", borderRadius: "14px", border: "1px dashed rgba(0,0,0,0.1)", textAlign: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", margin: 0 }}>No active postings</p>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={S.sideHeading}>Management</div>
            {[
              { path: "jobs", label: "Strategic Postings", icon: "work" },
              { path: "discover", label: "Elite Talent", icon: "person_search" },
              { path: "messages", label: "Direct Messages", icon: "chat_bubble", badge: unread },
              { path: "documents", label: "Document Hub", icon: "folder_open" },
              { path: "templates", label: "Compliance Docs", icon: "verified_user" },
              { path: "founding", label: "Founding Partner", icon: "workspace_premium", gold: true },
              { path: "billing", label: "Enterprise Luxe", icon: "credit_card" },
            ].map(item => (
              <div key={item.path} onClick={() => navigate(`/hirer/${item.path}`)} style={S.navItem(activePath === item.path, item.gold)}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background: "#0055FF", color: "#fff", fontSize: "10px", fontWeight: 900, padding: "2px 8px", borderRadius: "10px" }}>{item.badge}</span>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "24px" }}>
            <button onClick={() => navigate("/hirer")} style={S.ctaBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>post_add</span>
              Publish Opportunity
            </button>
            <button 
              onClick={logout} 
              style={S.signoutBtn}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,50,50,0.05)"; e.currentTarget.style.color = "#E53E3E"; e.currentTarget.style.borderColor = "rgba(220,50,50,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = "#6E6E73"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.05)"; }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={S.main}>
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
        </main>
      </div>
    </div>
  );
}
