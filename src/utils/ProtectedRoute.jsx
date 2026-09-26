import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../api/client";

// Wrap a dashboard route with this to require login.
// Usage: <Route path="/valuator" element={<ProtectedRoute><ValuatorDashboard /></ProtectedRoute>} />
export default function ProtectedRoute({ children }) {
    const session = getSession();
    const location = useLocation();
    if (!session) {
        return <Navigate to="/login" replace />;
    }
    if (localStorage.getItem("osm_force_password_change") === "true" && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />;
    }
    return children;
}
