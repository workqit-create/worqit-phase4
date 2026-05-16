// src/pages/admin/AdminAuditLogs.js
import React, { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

const ACTION_COLORS = {
    USER_SUSPENDED:     { bg: "rgba(220,50,50,.1)",   border: "rgba(220,50,50,.3)",   text: "#FC8181" },
    USER_UNSUSPENDED:   { bg: "rgba(0,200,100,.1)",   border: "rgba(0,200,100,.3)",   text: "#00C864" },
    USER_DELETED:       { bg: "rgba(220,50,50,.15)",  border: "rgba(220,50,50,.4)",   text: "#EF4444" },
    JOB_APPROVED:       { bg: "rgba(0,200,100,.1)",   border: "rgba(0,200,100,.3)",   text: "#00C864" },
    JOB_FLAGGED:        { bg: "rgba(255,170,0,.1)",   border: "rgba(255,170,0,.3)",   text: "#FFAA00" },
    AI_RESUME_PARSED:   { bg: "rgba(0,170,255,.1)",   border: "rgba(0,170,255,.3)",   text: "#00AAFF" },
    AI_CANDIDATE_MATCHED: { bg: "rgba(167,139,250,.1)", border: "rgba(167,139,250,.3)", text: "#A78BFA" },
    DEFAULT:            { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.1)", text: "#94A3B8" },
};

function ActionBadge({ type }) {
    const c = ACTION_COLORS[type] || ACTION_COLORS.DEFAULT;
    return (
        <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 5, padding: "2px 10px", fontSize: 11, fontWeight: 700, color: c.text, whiteSpace: "nowrap" }}>
            {type}
        </span>
    );
}

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "auditLogs"),
                    orderBy("timestamp", "desc"),
                    limit(200)
                );
                const snap = await getDocs(q);
                setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error("Audit log fetch error:", e);
            }
            setLoading(false);
        }
        load();
    }, []);

    const actionTypes = ["all", ...Array.from(new Set(logs.map(l => l.actionType)))];

    const filtered = filterType === "all" ? logs : logs.filter(l => l.actionType === filterType);

    return (
        <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Audit Logs</h1>
                <p style={{ color: C.silver, fontSize: 14, margin: 0 }}>
                    {logs.length} events tracked · Real-time system activity
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {actionTypes.map(t => (
                    <button key={t} onClick={() => setFilterType(t)}
                        style={{ background: filterType === t ? "rgba(26,111,232,.2)" : "rgba(255,255,255,.04)", border: filterType === t ? "1px solid rgba(26,111,232,.4)" : `1px solid ${C.line}`, borderRadius: 8, padding: "6px 14px", color: filterType === t ? "#fff" : C.silver, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>
                        {t === "all" ? `All (${logs.length})` : t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: C.silver, textAlign: "center", padding: 60 }}>
                    Loading audit trail…
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", color: C.silver, padding: 60 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No events recorded yet.</div>
                    <div style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>
                        Events are logged automatically as users and admins take actions on the platform.
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map(log => (
                        <div key={log.id} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                            <div style={{ minWidth: 140, color: C.silver, fontSize: 12 }}>
                                {log.timestamp?.seconds
                                    ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                                    : "—"}
                            </div>
                            <ActionBadge type={log.actionType} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    Target: <span style={{ color: C.cyan, fontFamily: "monospace" }}>{log.targetId}</span>
                                </div>
                                <div style={{ color: C.silver, fontSize: 11, marginTop: 2 }}>
                                    Actor: <span style={{ fontFamily: "monospace" }}>{log.actorId}</span>
                                    {log.ip && ` · IP: ${log.ip}`}
                                </div>
                            </div>
                            {log.details && Object.keys(log.details).length > 0 && (
                                <div style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: C.silver, fontFamily: "monospace", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {JSON.stringify(log.details)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
