import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../api/client";
import { logout as apiLogout } from "../../api/auth";
import { getScannerCorrectedScriptFile, getScannerScriptFile, listMyScannedScripts } from "../../api/valuation";

function openPdf(file) {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function ScannerQpFoldersDashboard() {
    const navigate = useNavigate();
    const session = getSession();
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [fileError, setFileError] = useState("");

    useEffect(() => {
        listMyScannedScripts()
            .then(setScripts)
            .catch((loadError) => setError(loadError.message || "Failed to load QP folders."))
            .finally(() => setLoading(false));
    }, []);

    const folders = useMemo(() => {
        const grouped = new Map();
        scripts.forEach((script) => {
            const code = script.qpCode || "Unassigned";
            if (!grouped.has(code)) grouped.set(code, []);
            grouped.get(code).push(script);
        });
        return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [scripts]);

    const handleOpenFile = async (script, corrected) => {
        setFileError("");
        try {
            const file = corrected
                ? await getScannerCorrectedScriptFile(script.id)
                : await getScannerScriptFile(script.id);
            openPdf(file);
        } catch (openError) {
            setFileError(openError.message || "Could not open the PDF.");
        }
    };

    const handleLogout = () => {
        apiLogout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700">QP folder scanner</p>
                    <h1 className="text-xl font-bold text-slate-900">{session?.username || "Scanner"}</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate("/scanner")} className="rounded border px-4 py-2 text-sm font-semibold">
                        Existing scanner
                    </button>
                    <button onClick={handleLogout} className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">
                        Log out
                    </button>
                </div>
            </header>
            <main className="mx-auto max-w-6xl space-y-5 p-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Papers grouped by QP code</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Each QP code has separate private storage folders for the original scan and corrected copy.
                    </p>
                </div>
                {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {fileError && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{fileError}</p>}
                {loading ? (
                    <p className="rounded border bg-white p-6 text-slate-600">Loading papers...</p>
                ) : folders.length === 0 ? (
                    <p className="rounded border bg-white p-6 text-slate-600">No scanned papers yet. Upload a booklet through the existing scanner.</p>
                ) : folders.map(([qpCode, qpScripts]) => (
                    <section key={qpCode} className="overflow-hidden rounded-lg border bg-white">
                        <div className="flex items-center justify-between bg-indigo-50 px-4 py-3">
                            <h3 className="font-bold text-indigo-900">{qpCode}</h3>
                            <span className="text-sm text-slate-600">{qpScripts.length} paper{qpScripts.length === 1 ? "" : "s"}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-left">
                                        <th className="border p-2">Role number</th>
                                        <th className="border p-2">Booklet</th>
                                        <th className="border p-2">Original folder</th>
                                        <th className="border p-2">Corrected folder</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qpScripts.map((script) => (
                                        <tr key={script.id}>
                                            <td className="border p-2">{script.candidateId || "—"}</td>
                                            <td className="border p-2">{script.answerBookletId}</td>
                                            <td className="border p-2">
                                                <button onClick={() => handleOpenFile(script, false)} className="font-semibold text-indigo-700 underline">
                                                    Open original
                                                </button>
                                            </td>
                                            <td className="border p-2">
                                                <button onClick={() => handleOpenFile(script, true)} className="font-semibold text-emerald-700 underline">
                                                    Open corrected
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}
