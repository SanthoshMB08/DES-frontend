// AUTHOR : ANKITH KUMAR [ https://www.ankith.dev  |  https//www.github.com/ankith-00 ]

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages Import
import LoginPage from "./pages/Auth/LoginPage"
import OtpPage from "./pages/Auth/OtpPage"
import ForcedPasswordChangePage from "./pages/Auth/ForcedPasswordChangePage";

import ValuatorDashboard from "./pages/Valuator/ValuatorDashboard";
import ReviewerDashboard from "./pages/Reviewer/RevieweDashboard";
import ScannerDashboard from "./pages/Scanner/ScannerDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import BOEDashboard from "./pages/BOE/BOEDashboardPage";
import ChiefDashboard from "./pages/Chief/ChiefDashboard";
import REDashboard from "./pages/RE/REDashboard";
import MarksLookupPage from "./pages/Marks/MarksLookupPage";
import ValuationWindowPage from "./pages/Shared/ValuationWindowPage";
import InvigilatorMobilePage from "./pages/Invigilator/InvigilatorMobilePage";

import ProtectedRoute from "./utils/ProtectedRoute";

// CSS
import "./Main.css";


// MAIN - UI
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN - PAGE */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        {/* OTP kept for later - login currently goes straight to the dashboard */}
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/change-password" element={<ProtectedRoute><ForcedPasswordChangePage /></ProtectedRoute>} />

        {/* ROLE DASHBOARDS */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/re" element={<ProtectedRoute><REDashboard /></ProtectedRoute>} />
        <Route path="/boe" element={<ProtectedRoute><BOEDashboard /></ProtectedRoute>} />
        <Route path="/chief" element={<ProtectedRoute><ChiefDashboard /></ProtectedRoute>} />
        <Route path="/reviewer" element={<ProtectedRoute><ReviewerDashboard /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><ScannerDashboard /></ProtectedRoute>} />
        <Route path="/valuator" element={<ProtectedRoute><ValuatorDashboard /></ProtectedRoute>} />
        <Route path="/invigilator" element={<ProtectedRoute><InvigilatorMobilePage /></ProtectedRoute>} />

        {/* PUBLIC - anyone can check marks, no login needed */}
        <Route path="/marks" element={<MarksLookupPage />} />

        {/* VALUATION EDITOR - opened from the Valuator dashboard with ?scriptId=... */}
        <Route path="/valuation" element={<ProtectedRoute><ValuationWindowPage /></ProtectedRoute>} />

      </Routes>
      <div className="project-watermark" aria-hidden="true">DIGITAL EVALUATION SYSTEM · PROJECT TEAM</div>
    </BrowserRouter>
  );
}
