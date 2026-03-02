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

      // Build status map
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

  return (
    <div style={{ padding: "32px 36px", maxWidth: 960, margin: "0 auto" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: C.ink2, border: "1px solid rgba(26,111,232,.4)",
          borderRadius: 12, padding: "14px 22px",
          color: "#fff", fontWeight: 600, fontSize: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
          Network
        </h1>
        <p style={{ color: C.silver, fontSize: 14 }}>Connect with other professionals on Worqit</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? "rgba(26,111,232,.15)" : "rgba(255,255,255,.04)",
              border: tab === t.id ? "1px solid rgba(26,111,232,.3)" : `1px solid ${C.line}`,
              borderRadius: 8, padding: "8px 18px",
              color: tab === t.id ? "#fff" : C.silver,
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13, cursor: "pointer", fontFamily: C.font,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: C.grad, borderRadius: "100px",
                padding: "1px 7px", fontSize: 11, fontWeight: 700, color: "#fff",
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, skill, or location…"
            style={{
              width: "100%", background: "rgba(255,255,255,.05)",
              border: `1px solid ${C.line}`, borderRadius: 10,
              padding: "11px 16px", color: "#fff", fontSize: 14,
              fontFamily: C.font, outline: "none", marginBottom: 20,
              boxSizing: "border-box",
            }}
          />
          {loading ? <LoadingGrid /> : filteredCandidates.length === 0 ? (
            <Empty text="No candidates found." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
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
          <Empty text="No connections yet — discover and connect with candidates!" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {connections.map(c => (
              <ProfileCard
                key={c.id}
                user={c.user}
                badgeText="Connected"
                actionLabel="Message"
                onAction={() => window.location.href = `/candidate/messages`}
              />
            ))}
          </div>
        )
      )}

      {tab === "requests" && (
        loading ? <LoadingGrid /> : pendingIn.length === 0 ? (
          <Empty text="No pending connection requests." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingIn.map(req => (
              <div key={req.id} style={{
                background: C.ink2, border: `1px solid ${C.line}`,
                borderRadius: 14, padding: "18px 22px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: C.grad, display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 800, fontSize: 16,
                  color: "#fff", flexShrink: 0,
                }}>
                  {(req.user?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{req.user?.name || "Unknown"}</div>
                  <div style={{ color: C.silver, fontSize: 13 }}>{req.user?.headline || "Candidate"}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleRespond(req.id, "accepted", req.user?.name)}
                    disabled={actionUid === req.id}
                    style={{
                      background: C.grad, border: "none", borderRadius: 8,
                      padding: "8px 16px", color: "#fff", fontWeight: 700,
                      fontSize: 13, cursor: "pointer", fontFamily: C.font,
                    }}
                  >Accept</button>
                  <button
                    onClick={() => handleRespond(req.id, "declined", req.user?.name)}
                    disabled={actionUid === req.id}
                    style={{
                      background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`,
                      borderRadius: 8, padding: "8px 16px", color: C.silver,
                      fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: C.font,
                    }}
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: 24, opacity: .5, height: 160 }} />
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: C.silver }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  );
}
