import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../api/client";
import { logout as apiLogout } from "../../api/auth";
import { getCorrectedPaper } from "../../api/valuation";

export default function StaffPaperDashboard() {
    const navigate = useNavigate();
    const session = getSession();
    const [roleNumber, setRoleNumber] = useState("");
    const [qpCode, setQpCode] = useState("");
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (event) => {
        event.preventDefault();
        if (!roleNumber.trim() || !qpCode.trim()) {
            setError("Enter both the role number and QP code.");
            return;
        }
        setDownloading(true);
        setError("");
        try {
            const file = await getCorrectedPaper(roleNumber.trim(), qpCode.trim());
            const url = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${roleNumber.trim()}-${qpCode.trim()}-corrected.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (downloadError) {
            setError(downloadError.message || "Could not download the corrected paper.");
        } finally {
            setDownloading(false);
        }
    };

    const handleLogout = () => {
        apiLogout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700">Staff access</p>
                    <h1 className="text-xl font-bold text-slate-900">{session?.username || "Staff"}</h1>
                </div>
                <button onClick={handleLogout} className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">
                    Log out
                </button>
            </header>
            <main className="mx-auto mt-10 max-w-xl rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Download corrected answer paper</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Enter the student role number and QP code. Only the corrected PDF is available here.
                </p>
                <form onSubmit={handleDownload} className="mt-6 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">
                        Role number
                        <input
                            value={roleNumber}
                            onChange={(event) => setRoleNumber(event.target.value)}
                            autoComplete="off"
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal"
                        />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                        QP code
                        <input
                            value={qpCode}
                            onChange={(event) => setQpCode(event.target.value)}
                            autoComplete="off"
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal"
                        />
                    </label>
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <button
                        type="submit"
                        disabled={downloading}
                        className="w-full rounded bg-indigo-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
                    >
                        {downloading ? "Preparing download..." : "Download corrected PDF"}
                    </button>
                </form>
            </main>
        </div>
    );
}
