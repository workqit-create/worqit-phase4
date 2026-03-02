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

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 28px 0", borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>Messages</h1>
        <p style={{ color: C.silver, fontSize: 13, marginTop: 4 }}>All candidate conversations in one place</p>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Conversation list */}
        <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${C.line}`, overflowY: "auto", background: C.ink2 }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 64, background: C.line, borderRadius: 10, marginBottom: 8, opacity: .5 }} />)}
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: C.silver }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
              <div style={{ fontSize: 14, marginBottom: 6 }}>No conversations yet</div>
              <div style={{ fontSize: 12, opacity: .7 }}>Go to Discover to message candidates</div>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = selected?.id === conv.id;
              const other = conv.otherUser;
              const initial = (other?.name || "?").charAt(0).toUpperCase();
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelect(conv)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", cursor: "pointer",
                    background: isActive ? "rgba(26,111,232,.12)" : "transparent",
                    borderLeft: isActive ? `3px solid ${C.royal}` : "3px solid transparent",
                    transition: "background .15s",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: C.grad, display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 800, fontSize: 15,
                    color: "#fff", flexShrink: 0, position: "relative",
                  }}>
                    {initial}
                    {conv.myUnread > 0 && (
                      <div style={{
                        position: "absolute", top: -2, right: -2,
                        width: 16, height: 16, background: C.royal,
                        borderRadius: "50%", fontSize: 9, fontWeight: 800,
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{conv.myUnread}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ color: "#fff", fontWeight: conv.myUnread > 0 ? 800 : 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {other?.name || "Unknown"}
                      </span>
                      <span style={{ color: C.silver, fontSize: 11, flexShrink: 0 }}>{timeAgo(conv.lastAt)}</span>
                    </div>
                    <div style={{ color: C.silver, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {other?.headline || "Candidate"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selected ? (
            <ChatWindow
              convId={selected.id}
              currentUid={currentUser.uid}
              otherUser={selected.otherUser}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.silver }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 15 }}>Select a conversation to start chatting</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
