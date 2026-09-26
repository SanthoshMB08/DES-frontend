import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, routeForRoles } from "../../api/auth";
import { getSession } from "../../api/client";

export default function ForcedPasswordChangePage() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) return setError("New passwords do not match.");
        setSaving(true); setError("");
        try {
            await changePassword(currentPassword, newPassword);
            localStorage.setItem("osm_force_password_change", "false");
            navigate(routeForRoles(getSession()?.roles));
        } catch (err) { setError(err.message || "Could not change password."); }
        finally { setSaving(false); }
    };
    return <div className="w-full h-screen flex items-center justify-center"><form onSubmit={submit} className="w-96 flex flex-col gap-4"><h1 className="font-lexend font-bold text-2xl">CHANGE PASSWORD</h1><p className="text-sm text-gray-600">A password change is required before continuing.</p><input required type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="border p-3 rounded"/><input required type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border p-3 rounded"/><input required type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="border p-3 rounded"/>{error && <p className="text-red-600 text-sm">{error}</p>}<button disabled={saving} className="bg-gray-900 text-white p-3 rounded">{saving ? "SAVING..." : "CONTINUE"}</button></form></div>;
}
