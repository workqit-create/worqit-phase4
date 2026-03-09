// src/pages/candidate/Analytics.js
// ═══════════════════════════════════════════════════════
//  Candidate Analytics — Phase 10
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { getCandidateApplications } from "../../services/jobService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Eye, FileText, MousePointerClick, Download } from "lucide-react";

export default function CandidateAnalytics() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalApps: 0,
        views: 0,
        interviews: 0,
        appTimeline: [],
        statusDist: []
    });

    useEffect(() => {
        async function fetchAnalytics() {
            if (!currentUser?.uid) return;
            try {
                const apps = await getCandidateApplications(currentUser.uid);

                // 1. Basic Stats
                const totalApps = apps.length;
                // Mocking views/interviews since we don't track profile views yet
                const views = Math.max(12, totalApps * 3 + Math.floor(Math.random() * 20));
                const interviews = apps.filter(a => a.status === 'interviewing').length;

                // 2. Timeline Data (Applications per month)
                // Group by month
                const monthlyCount = {};
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                apps.forEach(app => {
                    const date = app.appliedAt?.toDate ? app.appliedAt.toDate() : new Date();
                    const m = monthNames[date.getMonth()];
                    monthlyCount[m] = (monthlyCount[m] || 0) + 1;
                });

                // Fill last 6 months
                const timeline = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const m = monthNames[d.getMonth()];
                    timeline.push({ month: m, applications: monthlyCount[m] || 0 });
                }

                // 3. Status Distribution
                const statusMap = { applied: 0, reviewing: 0, interviewing: 0, rejected: 0, hired: 0 };
                apps.forEach(app => {
                    const st = app.status || 'applied';
                    statusMap[st] = (statusMap[st] || 0) + 1;
                });

                const dist = Object.entries(statusMap)
                    .filter(([_, count]) => count > 0)
                    .map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value
                    }));

                setStats({ totalApps, views, interviews, appTimeline: timeline, statusDist: dist });
            } catch (err) {
                console.error("Failed to load analytics", err);
            }
            setLoading(false);
        }

        fetchAnalytics();
    }, [currentUser]);

    const PIE_COLORS = [C.blue, C.yellow, C.green, C.cyan, "#EF4444"];

    const exportCSV = () => {
        const rows = [
            ["Month", "Applications"],
            ...stats.appTimeline.map(r => [r.month, r.applications]),
            [],
            ["Status", "Count"],
            ...stats.statusDist.map(r => [r.name, r.value]),
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `worqit_analytics_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const S = {
        container: { padding: "40px", color: "#fff", fontFamily: C.font, maxWidth: 1000, margin: "0 auto" },
        grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 },
        card: { background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 12 },
        statIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
        statLabel: { color: C.silver, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 },
        statValue: { fontSize: 32, fontWeight: 800, color: "#fff" },
        chartCard: { background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 32px", height: 380, flex: 1, minWidth: 400 },
        chartTitle: { fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }
    };

    if (loading) return null;

    return (
        <div style={S.container}>
            <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>My Insights</h1>
                    <p style={{ color: C.silver, fontSize: 15 }}>Track your application progress and profile performance.</p>
                </div>
                <button
                    onClick={exportCSV}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: C.font }}
                >
                    <Download size={15} /> Export CSV
                </button>
            </div>

            {/* Top Stats */}
            <div style={S.grid}>
                <div style={S.card}>
                    <div style={{ ...S.statIcon, background: "rgba(26,111,232,.1)", color: C.blue }}><MousePointerClick size={20} /></div>
                    <div style={S.statLabel}>Total Applications</div>
                    <div style={S.statValue}>{stats.totalApps}</div>
                </div>
                <div style={S.card}>
                    <div style={{ ...S.statIcon, background: "rgba(46,204,113,.1)", color: C.green }}><Eye size={20} /></div>
                    <div style={S.statLabel}>Search Appearances</div>
                    <div style={{ ...S.statValue, display: "flex", alignItems: "baseline", gap: 8 }}>
                        {stats.views} <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>↑ 12%</span>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={{ ...S.statIcon, background: "rgba(241,196,15,.1)", color: C.yellow }}><FileText size={20} /></div>
                    <div style={S.statLabel}>Interviews Scheduled</div>
                    <div style={S.statValue}>{stats.interviews}</div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

                {/* Bar Chart */}
                <div style={S.chartCard}>
                    <h2 style={S.chartTitle}><TrendingUp size={18} color={C.blue} /> Application Activity (6 Mos)</h2>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={stats.appTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                            <XAxis dataKey="month" stroke={C.silver} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={C.silver} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: "rgba(255,255,255,.05)" }}
                                contentStyle={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: "#fff" }}
                            />
                            <Bar dataKey="applications" fill={C.blue} radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div style={{ ...S.chartCard, flex: "0 1 350px", minWidth: 300 }}>
                    <h2 style={S.chartTitle}>Status Breakdown</h2>
                    {stats.statusDist.length === 0 ? (
                        <div style={{ height: "80%", display: "flex", alignItems: "center", justifyContent: "center", color: C.silver }}>
                            No applications yet.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie
                                    data={stats.statusDist}
                                    cx="50%" cy="45%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={5} dataKey="value"
                                >
                                    {stats.statusDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: "#fff" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    {/* Legend */}
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: -10 }}>
                        {stats.statusDist.map((entry, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.silver }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[index % PIE_COLORS.length] }} />
                                {entry.name} ({entry.value})
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
