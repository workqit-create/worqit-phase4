// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { LOGO_HORIZ } from "../../assets/logos";

import AdminStats      from "./AdminStats";
import AdminUsers      from "./AdminUsers";
import AdminJobs       from "./AdminJobs";
import AdminFounding100 from "./AdminFounding100";

const NAV = [
  { path: "",          label: "Stats Overview", icon: "📊" },
  { path: "users",     label: "All Users",      icon: "👥" },
  { path: "jobs",      label: "All Jobs",        icon: "💼" },
  { path: "founding",  label: "Founding 100",   icon: "🏆" },
];

export default function AdminDashboard() {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const seg = location.pathname.replace(/^\/admin\/?/, "").split("/")[0] || "";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.ink, fontFamily: C.font }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, flexShrink: 0, background: C.ink2, borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.line}` }}>
          <img src={LOGO_HORIZ} alt="Worqit" style={{ height: 36, width: "auto" }} />
        </div>

        <div style={{ padding: "10px 16px 0" }}>
          <div style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#FC8181", display: "inline-block" }}>
            🔐 Admin Panel
          </div>
        </div>

        <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(item => {
            const active = seg === item.path;
            return (
              <div key={item.path} onClick={() => navigate(`/admin/${item.path}`)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: active ? "rgba(220,50,50,.1)" : "transparent", border: active ? "1px solid rgba(220,50,50,.2)" : "1px solid transparent", color: active ? "#fff" : C.silver, fontWeight: active ? 700 : 500, fontSize: 14, transition: "all .15s" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#DC3232,#FF6B6B)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>A</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{userProfile?.name || "Admin"}</div>
              <div style={{ color: "#FC8181", fontSize: 11 }}>Administrator</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: "100%", background: "rgba(255,255,255,.04)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 0", color: C.silver, fontSize: 13, cursor: "pointer", fontFamily: C.font, fontWeight: 600 }}>Sign Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Routes>
          <Route path="/"         element={<AdminStats />} />
          <Route path="/users"    element={<AdminUsers />} />
          <Route path="/jobs"     element={<AdminJobs />} />
          <Route path="/founding" element={<AdminFounding100 />} />
        </Routes>
      </div>
    </div>
  );
}
