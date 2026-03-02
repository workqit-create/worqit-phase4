// src/pages/shared/theme.js
// ═══════════════════════════════════════════════════════
//  Shared design tokens — matches Landing / Login exactly
// ═══════════════════════════════════════════════════════

export const C = {
  ink:    "#060C1A",
  ink2:   "#0A1228",
  ink3:   "#0D1530",
  royal:  "#1A6FE8",
  cyan:   "#00AAFF",
  deep:   "#0035CC",
  silver: "#7A90B8",
  text:   "#C8D4E8",
  line:   "rgba(255,255,255,.07)",
  grad:   "linear-gradient(135deg,#00AAFF 0%,#1A6FE8 45%,#0035CC 100%)",
  gtext:  "linear-gradient(135deg,#00AAFF,#1A6FE8)",
  font:   "'Plus Jakarta Sans', sans-serif",
};

export const STATUS_COLORS = {
  pending:  { bg: "rgba(255,170,0,.12)", border: "rgba(255,170,0,.3)",  text: "#FFAA00" },
  viewed:   { bg: "rgba(0,170,255,.10)", border: "rgba(0,170,255,.3)",  text: "#00AAFF" },
  accepted: { bg: "rgba(0,200,100,.10)", border: "rgba(0,200,100,.3)",  text: "#00C864" },
  rejected: { bg: "rgba(220,50,50,.10)", border: "rgba(220,50,50,.3)",  text: "#FC8181" },
  open:     { bg: "rgba(0,200,100,.10)", border: "rgba(0,200,100,.3)",  text: "#00C864" },
  closed:   { bg: "rgba(120,120,120,.10)", border: "rgba(120,120,120,.3)", text: "#7A90B8" },
};
