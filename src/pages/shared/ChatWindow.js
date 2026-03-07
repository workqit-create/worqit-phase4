// src/pages/shared/ChatWindow.js
// ═══════════════════════════════════════════════════════
//  Reusable chat UI — used by both hirer and candidate
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { C } from "./theme";
import { useNavigate } from "react-router-dom";
import { sendMessage, listenToMessages, markConversationRead } from "../../services/messageService";
import { createDocumentRequest } from "../../services/documentService";

import callService from "../../services/callService";
import { useAuth } from "../../context/AuthContext";

export default function ChatWindow({ convId, currentUid, currentUser, otherUser, onBack }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);
  const [requestingDoc, setRequestingDoc] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!convId) return;
    markConversationRead(convId, currentUid).catch(() => { });
    const unsub = listenToMessages(convId, setMessages);
    return unsub;
  }, [convId, currentUid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(convId, currentUid, trimmed);
    } catch (e) {
      setText(trimmed);
    }
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function startCall() {
    if (calling || !otherUser?.uid) return;
    setCalling(true);
    try {
      const callerName = userProfile?.name || 'User';

      // Always guarantee the socket is registered before we try to emit
      callService.connect(currentUid);

      // Generate callId ourselves — never depend on initiateCall() returning it
      const callId = 'call-' + Date.now();

      // Fire the socket notification (best-effort — doesn't block)
      callService.initiateCall(
        otherUser.uid,
        currentUid,
        callerName,
        'webrtc-call'
      );

      // Send a chat message so receiver can also join manually if popup is missed
      await sendMessage(convId, currentUid, `📞 Direct Call started! Accept the popup to join.`);

      // Navigate immediately as the Caller
      navigate(`/meeting/${callId}`, {
        state: {
          targetUserId: otherUser.uid,
          otherUserName: otherUser.name || 'User',
          isCaller: true,
        },
      });

    } catch (e) {
      console.error(e);
      alert('Error starting call. Please try again.');
    }
    setCalling(false);
  }

  async function handleRequestDocument() {
    if (requestingDoc || otherUser?.userType !== "candidate") return;

    const docType = window.prompt("What document are you requesting? (e.g., Passport, Resume, Offer Letter)");
    if (!docType) return;

    setRequestingDoc(true);
    try {
      // Create formal request
      await createDocumentRequest(currentUid, otherUser.uid, null, docType, "Requested via Chat");

      // Send a system message to the chat
      await sendMessage(
        convId,
        currentUid,
        `📄 Requested a document: *${docType}*. Please upload and share it from your Document Vault.`
      );
    } catch (e) {
      console.error(e);
      alert("Failed to request document.");
    }
    setRequestingDoc(false);
  }

  const avatar = otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.ink }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px", borderBottom: `1px solid ${C.line}`,
        background: C.ink2,
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "none", color: C.silver,
            cursor: "pointer", fontSize: 20, padding: "0 8px 0 0", lineHeight: 1,
          }}>←</button>
        )}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: C.grad, display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0,
        }}>{avatar}</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            {otherUser?.name || "Unknown"}
          </div>
          <div style={{ color: C.silver, fontSize: 12 }}>
            {otherUser?.userType === "hirer"
              ? otherUser?.companyName || "Hirer"
              : otherUser?.headline || "Candidate"}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>

          {currentUser?.userType === "hirer" && otherUser?.userType === "candidate" && (
            <button
              onClick={handleRequestDocument}
              disabled={requestingDoc}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 12,
                padding: "8px 16px",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: requestingDoc ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all .2s"
              }}
            >
              📄 Req Doc
            </button>
          )}

          <button
            onClick={startCall}
            disabled={calling}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 12,
              padding: "8px 16px",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: calling ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: calling ? 0.7 : 1,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => !calling && (e.currentTarget.style.background = C.grad)}
            onMouseOut={(e) => !calling && (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          >
            {calling ? "Calling..." : (
              <>
                <span style={{ fontSize: 16 }}>📞</span> Call
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 12px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: C.silver, fontSize: 14, marginTop: 40 }}>
            No messages yet. Say hello! 👋
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.senderId === currentUid;
          return (
            <div key={msg.id} style={{
              display: "flex", justifyContent: mine ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}>
              <div style={{
                maxWidth: "72%",
                background: mine
                  ? "linear-gradient(135deg,#1A6FE8,#0035CC)"
                  : C.ink3,
                border: mine ? "none" : `1px solid ${C.line}`,
                borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "10px 14px",
                color: mine ? "#fff" : C.text,
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: `1px solid ${C.line}`,
        background: C.ink2,
        display: "flex", gap: 10,
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1,
            background: "rgba(255,255,255,.05)",
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 14,
            fontFamily: C.font,
            resize: "none",
            outline: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          style={{
            background: C.grad,
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: C.font,
            opacity: (!text.trim() || sending) ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div >
  );
}
