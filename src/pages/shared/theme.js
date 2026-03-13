// src/pages/shared/theme.js
// ═══════════════════════════════════════════════════════
//  Shared design tokens — Ultra-Premium White/Blue/Gold
// ═══════════════════════════════════════════════════════

export const C = {
  ink:    "#FFFFFF",
  ink2:   "#FBFBFD",
  ink3:   "#F5F5F7",
  royal:  "#0055FF",
  cyan:   "#00AAFF",
  deep:   "#0033CC",
  gold:   "#F5A623",
  gold_deep: "#D97706",
  silver: "#6E6E73",
  text:   "#1D1D1F",
  line:   "rgba(0,0,0,.08)",
  grad:   "linear-gradient(135deg,#0055FF 0%,#00AAFF 100%)",
  gtext:  "linear-gradient(135deg,#0055FF,#00AAFF)",
  gold_grad: "linear-gradient(135deg,#F5A623 0%,#D97706 100%)",
  font:   "'Plus Jakarta Sans', sans-serif",
  
  // Graded blues for backgrounds and borders
  blue_soft: "rgba(0, 85, 255, 0.05)",
  blue_border: "rgba(0, 85, 255, 0.15)",
  slate_soft: "#F8FAFC",
  slate_border: "#E2E8F0",
};

export const STATUS_COLORS = {
  pending:  { bg: "rgba(245,166,35,.12)", border: "rgba(245,166,35,.3)",  text: "#F5A623" },
  viewed:   { bg: "rgba(0,170,255,.10)", border: "rgba(0,170,255,.3)",  text: "#00AAFF" },
  accepted: { bg: "rgba(0,180,100,.10)", border: "rgba(0,180,100,.3)",  text: "#00B464" },
  rejected: { bg: "rgba(220,50,50,.10)", border: "rgba(220,50,50,.3)",  text: "#E53E3E" },
  open:     { bg: "rgba(0,180,100,.10)", border: "rgba(0,180,100,.3)",  text: "#00B464" },
  closed:   { bg: "rgba(110,110,115,.10)", border: "rgba(110,110,115,.3)", text: "#6E6E73" },
};
