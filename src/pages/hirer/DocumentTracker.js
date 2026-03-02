// src/pages/hirer/DocumentTracker.js
// ═══════════════════════════════════════════════════════
//  Document Tracker — Hirer View (Phase 7)
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDocumentRequests } from "../../services/documentService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { C } from "../shared/theme";
import { FileText, Clock, CheckCircle } from "lucide-react";

export default function DocumentTracker() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadRequests();
        }
    }, [currentUser]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const reqs = await getDocumentRequests(currentUser.uid, "hirer");

            // Fetch candidate names and resolved document URLs
            const enriched = await Promise.all(reqs.map(async (r) => {
                let candidateName = "Unknown Candidate";
                let docData = null;

                try {
                    // Get candidate info
                    const candSnap = await getDoc(doc(db, "users", r.candidateId));
                    if (candSnap.exists()) {
                        candidateName = candSnap.data().name || "Candidate";
                    }

                    // If fulfilled, get the document URL
                    if (r.status === "fulfilled" && r.fulfilledWithDocId) {
                        const docSnap = await getDoc(doc(db, "documents", r.fulfilledWithDocId));
                        if (docSnap.exists()) {
                            docData = docSnap.data();
                        }
                    }
                } catch (e) {
                    console.error("Error fetching details for request", r.id, e);
                }

                return { ...r, candidateName, docData };
            }));

            setRequests(enriched);
        } catch (e) {
            console.error("Error loading document requests:", e);
        } finally {
            setLoading(false);
        }
    };

    const S = {
        container: { padding: "30px 40px", color: "#fff", fontFamily: C.font, maxWidth: 1000, margin: "0 auto" },
        header: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
        sub: { color: C.silver, fontSize: 15, marginBottom: 30 },

        card: {
            background: C.ink2, borderRadius: 12, border: `1px solid ${C.line}`,
            padding: 20, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between"
        },

        left: { display: "flex", alignItems: "center", gap: 16 },
        icon: (status) => ({
            width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            background: status === "fulfilled" ? "rgba(46,204,113,.15)" : "rgba(241,196,15,.15)",
            color: status === "fulfilled" ? C.green : C.yellow
        }),

        title: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
        meta: { fontSize: 13, color: C.silver, display: "flex", gap: 12, alignItems: "center" },

        statusBadge: (status) => ({
            padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 700,
            background: status === "fulfilled" ? `${C.green}20` : `${C.yellow}20`,
            color: status === "fulfilled" ? C.green : C.yellow,
            display: "flex", alignItems: "center", gap: 6
        }),

        btn: {
            background: C.blue, color: "#fff", border: "none", padding: "8px 16px",
            borderRadius: 8, fontWeight: 600, cursor: "pointer", textDecoration: "none",
            display: "inline-block"
        }
    };

    return (
        <div style={S.container}>
            <h1 style={S.header}>Document Tracker</h1>
            <p style={S.sub}>Manage and view compliance documents requested from candidates.</p>

            {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: C.silver }}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", background: C.ink2, borderRadius: 12, border: `1px dashed ${C.line}` }}>
                    <FileText size={48} color={C.silver} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <div style={{ fontSize: 16, fontWeight: 600 }}>No document requests yet</div>
                    <div style={{ fontSize: 14, color: C.silver, marginTop: 8 }}>
                        Open a chat with a candidate and click "Req Doc" to ask for passports, resumes, or other files.
                    </div>
                </div>
            ) : (
                requests.map(req => (
                    <div key={req.id} style={S.card}>
                        <div style={S.left}>
                            <div style={S.icon(req.status)}>
                                {req.status === "fulfilled" ? <CheckCircle size={24} /> : <Clock size={24} />}
                            </div>
                            <div>
                                <div style={S.title}>{req.documentType}</div>
                                <div style={S.meta}>
                                    <span>Requested from <strong>{req.candidateName}</strong></span>
                                    <span>•</span>
                                    <span>{new Date(req.requestedAt?.toDate()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={S.statusBadge(req.status)}>
                                {req.status === "fulfilled" ? "Fulfilled" : "Pending Candidate Upload"}
                            </div>

                            {req.status === "fulfilled" && req.docData?.url && (
                                <a href={req.docData.url} target="_blank" rel="noopener noreferrer" style={S.btn}>
                                    Download
                                </a>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
