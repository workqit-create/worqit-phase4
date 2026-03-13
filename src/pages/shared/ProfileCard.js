// src/pages/shared/ProfileCard.js
// ═══════════════════════════════════════════════════════
//  Candidate card — shown in Discover, Network, etc.
// ═══════════════════════════════════════════════════════

import React from "react";
import { C } from "./theme";

export default function ProfileCard({ user, matchScore, actionLabel, onAction, actionDisabled, badgeText, badgeColor }) {
  const initials = (user?.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const skills = user?.skills || [];

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      transition: "all .2s",
      cursor: "default",
      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    }}
      onMouseEnter={e => { 
        e.currentTarget.style.borderColor = "rgba(0,85,255,0.2)"; 
        e.currentTarget.style.transform = "translateY(-2px)"; 
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.borderColor = C.line; 
        e.currentTarget.style.transform = "none"; 
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: C.grad, display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 800, fontSize: 17,
          color: "#fff", flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
            {user?.name || "Unknown"}
            {matchScore && (
              <span style={{
                background: "rgba(0,85,255,.08)", color: C.royal,
                padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 800
              }}>
                {matchScore}% Match
              </span>
            )}
          </div>
          <div style={{ color: C.silver, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.headline || "Candidate"}
          </div>
          {user?.location && (
            <div style={{ color: C.silver, fontSize: 12, marginTop: 3, opacity: .7 }}>
              📍 {user.location}
            </div>
          )}
        </div>
        {badgeText && (
          <div style={{
            background: badgeColor || "rgba(0,180,100,.08)",
            border: `1px solid ${badgeColor ? badgeColor.replace(".1)", ".2)") : "rgba(0,180,100,.2)"}`,
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "#00B464",
            flexShrink: 0,
          }}>{badgeText}</div>
        )}
      </div>

      {/* Bio */}
      {user?.bio && (
        <div style={{
          color: C.silver, fontSize: 13, lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>
          {user.bio}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.slice(0, 5).map((s, i) => (
            <span key={i} style={{
              background: "rgba(0,85,255,.05)",
              border: "1px solid rgba(0,85,255,.1)",
              borderRadius: 6, padding: "3px 10px",
              fontSize: 11, fontWeight: 600, color: C.royal,
            }}>{s}</span>
          ))}
          {skills.length > 5 && (
            <span style={{ fontSize: 11, color: C.silver, padding: "3px 0" }}>+{skills.length - 5} more</span>
          )}
        </div>
      )}

      {/* Action button */}
      {actionLabel && (
        <button
          onClick={onAction}
          disabled={actionDisabled}
          style={{
            background: actionDisabled ? "rgba(0,0,0,.03)" : C.grad,
            border: actionDisabled ? `1px solid ${C.line}` : "none",
            borderRadius: 8,
            padding: "10px 0",
            color: actionDisabled ? C.silver : "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: actionDisabled ? "default" : "pointer",
            fontFamily: C.font,
            width: "100%",
            transition: "all .2s",
            boxShadow: actionDisabled ? "none" : "0 4px 12px rgba(0,85,255,.2)",
          }}
          onMouseEnter={e => { if(!actionDisabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { if(!actionDisabled) e.currentTarget.style.transform = "none"; }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
