// src/pages/candidate/Network.js
// ═══════════════════════════════════════════════════════
//  Candidate ↔ Candidate networking
//  Connect request → accept → message
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import ProfileCard from "../shared/ProfileCard";
import {
  getAllCandidates, sendConnectRequest, getConnections,
  getPendingRequests, respondToConnection, getConnectionStatus
} from "../../services/connectionService";

export default function CandidateNetwork() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState("discover");
  const [candidates, setCandidates] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingIn, setPendingIn] = useState([]);
  const [connStatuses, setConnStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [all, conns, pending] = await Promise.all([
        getAllCandidates(currentUser.uid),
        getConnections(currentUser.uid),
        getPendingRequests(currentUser.uid),
      ]);
      setCandidates(all);
      setConnections(conns);
      setPendingIn(pending);

      const statusMap = {};
      await Promise.all(all.map(async c => {
        const status = await getConnectionStatus(currentUser.uid, c.uid);
        statusMap[c.uid] = status;
      }));
      setConnStatuses(statusMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [currentUser.uid]);

  async function handleConnect(candidate) {
    setActionUid(candidate.uid);
    try {
      await sendConnectRequest(currentUser.uid, candidate.uid);
      showToast(`Connect request sent to ${candidate.name}!`);
      await loadAll();
    } catch { showToast("Something went wrong."); }
    setActionUid(null);
  }

  async function handleRespond(connectionId, action, name) {
    setActionUid(connectionId);
    try {
      await respondToConnection(connectionId, action);
      showToast(action === "accepted" ? `Connected with ${name}! 🎉` : "Request declined.");
      await loadAll();
    } catch { showToast("Something went wrong."); }
    setActionUid(null);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function getActionLabel(uid) {
    const s = connStatuses[uid];
    if (!s) return "Connect";
    if (s.status === "pending" && s.requesterId === currentUser.uid) return "Requested";
    if (s.status === "pending" && s.receiverId === currentUser.uid) return "Accept";
    if (s.status === "accepted") return "Connected ✓";
    return "Connect";
  }

  function isDisabled(uid) {
    const s = connStatuses[uid];
    if (!s) return false;
    if (s.status === "accepted") return true;
    if (s.status === "pending" && s.requesterId === currentUser.uid) return true;
    return false;
  }

  const filteredCandidates = candidates.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.headline?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase()) ||
    (c.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const tabs = [
    { id: "discover", label: "Discover", count: null },
    { id: "connections", label: "My Network", count: connections.length || null },
    { id: "requests", label: "Requests", count: pendingIn.length || null },
  ];

  const S = {
    container: { maxWidth: "1200px", margin: "0 auto", fontFamily: C.font, color: "#1D1D1F" },
    header: { marginBottom: "48px" },
    title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    
    tabBar: { display: "flex", gap: "12px", marginBottom: "40px", padding: "6px", background: "#F1F5F9", borderRadius: "20px", width: "fit-content" },
    tabBtn: (active) => ({
      padding: "12px 24px", borderRadius: "14px", border: "none",
      background: active ? "#fff" : "transparent",
      color: active ? "#0055FF" : "#64748B",
      fontWeight: 800, fontSize: "13px", cursor: "pointer",
      boxShadow: active ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
      transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
    }),
    badge: { background: "#0055FF", color: "#fff", borderRadius: "100px", padding: "2px 8px", fontSize: "10px", fontWeight: 900 },
    
    searchBox: { position: "relative", marginBottom: "40px" },
    input: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "18px 24px 18px 56px", fontSize: "15px", fontWeight: 600, color: "#1D1D1F", outline: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "all 0.2s" },
    searchIcon: { position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "24px" },
    
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
    
    requestItem: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "24px", padding: "24px 32px", display: "flex", alignItems: "center", gap: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", marginBottom: "16px" },
    avatar: { width: "56px", height: "56px", borderRadius: "18px", background: "linear-gradient(135deg, #0055FF, #00AAFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: "#fff" },
    
    toast: { position: "fixed", bottom: "40px", right: "40px", zIndex: 1000, background: "#1D1D1F", color: "#fff", padding: "16px 32px", borderRadius: "16px", fontWeight: 800, fontSize: "14px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: "12px" }
  };

  return (
    <div style={S.container}>
      {toast && (
        <div style={S.toast}>
          <span className="material-symbols-outlined" style={{ color: "#10B981" }}>check_circle</span>
          {toast}
        </div>
      )}

      <div style={S.header}>
        <h1 style={S.title}>Strategic Network</h1>
        <p style={S.subtitle}>Connect with elite professionals in the UAE ecosystem.</p>
      </div>

      <div style={S.tabBar}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={S.tabBtn(tab === t.id)}>
            {t.label}
            {t.count > 0 && <span style={S.badge}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <>
          <div style={S.searchBox}>
            <span className="material-symbols-outlined" style={S.searchIcon}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by expertise, organization, or location..."
              style={S.input}
              onFocus={e => e.target.style.borderColor = "#0055FF"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>
          {loading ? <LoadingGrid /> : filteredCandidates.length === 0 ? (
            <Empty text="No professionals matching your search parameters." />
          ) : (
            <div style={S.grid}>
              {filteredCandidates.map(c => (
                <ProfileCard
                  key={c.uid}
                  user={c}
                  actionLabel={getActionLabel(c.uid)}
                  actionDisabled={isDisabled(c.uid) || actionUid === c.uid}
                  onAction={() => handleConnect(c)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "connections" && (
        loading ? <LoadingGrid /> : connections.length === 0 ? (
          <Empty text="Your network is empty. Start discovering elite talent." />
        ) : (
          <div style={S.grid}>
            {connections.map(c => (
              <ProfileCard
                key={c.id}
                user={c.user}
                badgeText="Connected"
                actionLabel="Direct Message"
                onAction={() => window.location.href = `/candidate/messages`}
              />
            ))}
          </div>
        )
      )}

      {tab === "requests" && (
        loading ? <LoadingGrid /> : pendingIn.length === 0 ? (
          <Empty text="No active connection requests pending." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {pendingIn.map(req => (
              <div key={req.id} style={S.requestItem}>
                <div style={S.avatar}>{(req.user?.name || "?").charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#1D1D1F", fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>{req.user?.name || "Anonymous User"}</div>
                  <div style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600 }}>{req.user?.headline || "Strategic Candidate"}</div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => handleRespond(req.id, "accepted", req.user?.name)}
                    disabled={actionUid === req.id}
                    style={{ background: "#0055FF", border: "none", borderRadius: "12px", padding: "10px 24px", color: "#fff", fontWeight: 800, fontSize: "12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
                  >Accept</button>
                  <button
                    onClick={() => handleRespond(req.id, "declined", req.user?.name)}
                    disabled={actionUid === req.id}
                    style={{ background: "#F1F5F9", border: "none", borderRadius: "12px", padding: "10px 24px", color: "#64748B", fontWeight: 800, fontSize: "12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
                  >Decline</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px", height: "240px", opacity: 0.5 }} />
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "120px 40px", background: "#fff", borderRadius: "32px", border: "1px dashed #E2E8F0" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#E2E8F0", marginBottom: "24px" }}>diversity_3</span>
      <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1D1D1F", margin: "0 0 8px" }}>Network Activity</h3>
      <p style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 600 }}>{text}</p>
    </div>
  );
}

