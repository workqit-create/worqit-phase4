// src/pages/admin/AdminStats.js
import React, { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminStats() {
  const [stats, setStats] = useState({ candidates: 0, hirers: 0, jobs: 0, applications: 0, conversations: 0, founding: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, jobs, apps, convs, f100] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "jobs")),
          getDocs(collection(db, "applications")),
          getDocs(collection(db, "conversations")),
          getDocs(query(collection(db, "founding100"))),
        ]);
        const candidates = users.docs.filter(d => d.data().userType === "candidate").length;
        const hirers     = users.docs.filter(d => d.data().userType === "hirer").length;
        setStats({ candidates, hirers, jobs: jobs.size, applications: apps.size, conversations: convs.size, founding: f100.size });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: "Total Candidates", value: stats.candidates, icon: "🎯", color: C.cyan },
    { label: "Total Hirers",     value: stats.hirers,     icon: "🏢", color: "#1A6FE8" },
    { label: "Jobs Posted",      value: stats.jobs,       icon: "💼", color: "#00C864" },
    { label: "Applications",     value: stats.applications, icon: "📋", color: "#FFAA00" },
    { label: "Conversations",    value: stats.conversations, icon: "💬", color: "#A78BFA" },
    { label: "Founding 100",     value: `${stats.founding}/100`, icon: "🏆", color: "#FFAA00" },
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Platform Stats</h1>
        <p style={{ color: C.silver, fontSize: 14, margin: 0 }}>Live overview of all activity on Worqit</p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 120, background: C.ink2, borderRadius: 16, opacity: .5 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 22px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ color: c.color, fontWeight: 800, fontSize: 34, letterSpacing: -1, lineHeight: 1 }}>{c.value}</div>
              <div style={{ color: C.silver, fontSize: 13, marginTop: 6 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Platform Health</div>
        {[
          { label: "Candidates with complete profiles", value: "—", note: "Check profiles collection" },
          { label: "Average applications per job", value: stats.jobs > 0 ? (stats.applications / stats.jobs).toFixed(1) : "0", note: "applications ÷ jobs" },
          { label: "Total registered users", value: stats.candidates + stats.hirers, note: "candidates + hirers" },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
            <div>
              <div style={{ color: C.text, fontSize: 14 }}>{r.label}</div>
              <div style={{ color: C.silver, fontSize: 12, opacity: .7 }}>{r.note}</div>
            </div>
            <div style={{ color: C.cyan, fontWeight: 800, fontSize: 18 }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
