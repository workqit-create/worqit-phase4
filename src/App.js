// src/App.js
// ═══════════════════════════════════════════════════════
//  WORQIT — Phase 4
//  Fixes: /hirer/dashboard → /hirer routing bug
//  Adds:  /admin route for admin panel
// ═══════════════════════════════════════════════════════

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import HirerDashboard from "./pages/hirer/HirerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MeetingRoom from "./pages/shared/MeetingRoom";
import callService from "./services/callService";
import IncomingCallPopup from "./components/IncomingCallPopup";

// ── Returns the correct home path for each user type ────
function homePath(userType) {
  if (userType === "hirer") return "/hirer";
  if (userType === "admin") return "/admin";
  return "/candidate";
}

// ── Protects pages that need login ──────────────────────
function ProtectedRoute({ children, allowedType }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  // Wait for the profile to load before checking type
  if (!userProfile) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#060C1A", color: "#7A90B8", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Loading…</div>;
  }
  if (allowedType && userProfile.userType !== allowedType) {
    return <Navigate to={homePath(userProfile.userType)} replace />;
  }
  return children;
}

// ── Stops logged-in users seeing login/signup ───────────
function PublicRoute({ children }) {
  const { currentUser, userProfile } = useAuth();
  if (currentUser) {
    return <Navigate to={homePath(userProfile?.userType)} replace />;
  }
  return children;
}

// ── All routes ───────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      <Route path="/hirer/*" element={
        <ProtectedRoute allowedType="hirer"><HirerDashboard /></ProtectedRoute>
      } />

      <Route path="/candidate/*" element={
        <ProtectedRoute allowedType="candidate"><CandidateDashboard /></ProtectedRoute>
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute allowedType="admin"><AdminDashboard /></ProtectedRoute>
      } />

      {/* Shared Route for Call Testing */}
      <Route path="/meeting/:id" element={
        <ProtectedRoute><MeetingRoom /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── App Wrapper ──────────────────────────────────────────
function MainApp() {
  const { currentUser, userProfile } = useAuth();

  // Connect socket.io when authenticated
  React.useEffect(() => {
    if (currentUser) {
      callService.connect(currentUser.uid);
    } else {
      callService.disconnect();
    }
  }, [currentUser]);

  return (
    <>
      <AppRoutes />
      {/* Global popup so it triggers anywhere in the dashboard */}
      {currentUser && <IncomingCallPopup currentUser={{ uid: currentUser.uid, ...userProfile }} />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </Router>
  );
}
