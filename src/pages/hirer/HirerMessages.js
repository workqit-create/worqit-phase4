// src/pages/hirer/HirerMessages.js
// ═══════════════════════════════════════════════════════
//  Hirer inbox + chat
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import ChatWindow from "../shared/ChatWindow";
import { getUserConversations } from "../../services/messageService";

export default function HirerMessages() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadConvs() {
    try {
      const convs = await getUserConversations(currentUser.uid);
      setConversations(convs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { loadConvs(); }, [currentUser.uid]);

  useEffect(() => {
    if (conversations.length > 0 && !selected) {
      setSelected(conversations[0]);
    }
  }, [conversations]);

  function handleSelect(conv) {
    setSelected(conv);
    setConversations(prev => prev.map(c =>
      c.id === conv.id ? { ...c, myUnread: 0 } : c
    ));
  }

  const timeAgo = (ts) => {
    if (!ts?.toDate) return "";
    const diff = Math.floor((new Date() - ts.toDate()) / 1000);
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const S = {
    container: { height: "calc(100vh - 180px)", display: "flex", background: "#fff", borderRadius: "32px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" },
    sidebar: { width: "380px", borderRight: "1px solid #F1F5F9", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)" },
    sideHeader: { padding: "32px", borderBottom: "1px solid #F1F5F9" },
    sideTitle: { fontSize: "24px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.5px", margin: 0 },
    sideSub: { fontSize: "12px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" },
    convList: { flex: 1, overflowY: "auto" },
    convItem: (active) => ({
      display: "flex", alignItems: "center", gap: "16px", padding: "20px 32px", cursor: "pointer",
      background: active ? "rgba(0,85,255,0.04)" : "transparent",
      borderLeft: `4px solid ${active ? "#0055FF" : "transparent"}`,
      transition: "all 0.2s"
    }),
    avatar: {
      width: "48px", height: "48px", borderRadius: "16px", background: "linear-gradient(135deg, #0055FF, #00AAFF)",
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "16px", position: "relative", flexShrink: 0
    },
    unreadBadge: {
      position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", background: "#0055FF",
      borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "9px", fontWeight: 900, color: "#fff"
    },
    chatArea: { flex: 1, display: "flex", flexDirection: "column", background: "#fff" },
    emptyChat: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "48px", textAlign: "center" }
  };

  return (
    <div style={S.container}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={S.sideHeader}>
          <h2 style={S.sideTitle}>Elite Inbox</h2>
          <p style={S.sideSub}>{conversations.length} Strategic Threads</p>
        </div>

        <div style={S.convList}>
          {loading ? (
            <div style={{ padding: "32px" }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: "80px", background: "#F1F5F9", borderRadius: "16px", marginBottom: "12px", opacity: 0.5 }} />)}
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "64px 32px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#E2E8F0", marginBottom: "16px" }}>chat_bubble</span>
              <p style={{ color: "#94A3B8", fontWeight: 700, fontSize: "14px" }}>No conversations found.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = selected?.id === conv.id;
              const other = conv.otherUser;
              const initial = (other?.name || "?").charAt(0).toUpperCase();
              return (
                <div key={conv.id} onClick={() => handleSelect(conv)} style={S.convItem(isActive)}>
                  <div style={S.avatar}>
                    {initial}
                    {conv.myUnread > 0 && <div style={S.unreadBadge}>{conv.myUnread}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px", color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other?.name || "Unknown"}</span>
                      <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>{timeAgo(conv.lastAt)}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other?.headline || "Strategic Candidate"}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={S.chatArea}>
        {selected ? (
          <ChatWindow convId={selected.id} currentUid={currentUser.uid} otherUser={selected.otherUser} />
        ) : (
          <div style={S.emptyChat}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#F1F5F9", marginBottom: "24px" }}>forum</span>
            <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#1D1D1F", marginBottom: "8px" }}>Direct Messaging</h3>
            <p style={{ color: "#94A3B8", fontWeight: 600, maxWidth: "280px", lineHeight: 1.5 }}>Select a candidate from your inbox to begin strategic dialogue.</p>
          </div>
        )}
      </div>
    </div>
  );
}

