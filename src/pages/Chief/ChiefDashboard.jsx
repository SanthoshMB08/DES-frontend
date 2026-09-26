import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoLockOpenOutline, IoAdd } from "react-icons/io5";
import { SlGraph } from "react-icons/sl";
import { FiUsers, FiFileText } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import StatCard from "../../components/Shared/StatsCard";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";
import {
    listChiefBundles,
    listUnbundledScripts,
    formBundle,
    listChiefEvaluators,
    assignBundle,
    createReviewer,
    listChiefReviewers,
    getChiefScriptFile,
} from "../../api/valuation";

const emptyReviewerForm = { username: "", password: "", fullName: "" };

export default function ChiefDashboard() {
    const navigate = useNavigate();
    const session = getSession();

    const userInfo = {
        id: session?.username?.toUpperCase() || "CHIEF",
        name: session?.username || "Subject Chief",
        role: "CHIEF"
    };
    const openScript = async (script) => {
        try {
            const blob = await getChiefScriptFile(script.id);
            window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch (err) { setLoadError(err.message || "Failed to open answer sheet."); }
    };

    const [activeTab, setActiveTab] = useState("dashboard");

    // ---- Bundles / answer sheets ----
    const [bundles, setBundles] = useState([]);
    const [unbundled, setUnbundled] = useState([]);
    const [evaluators, setEvaluators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formingBundle, setFormingBundle] = useState(false);
    const [assigningId, setAssigningId] = useState(null);

    const loadAll = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const [bundleData, unbundledData, evaluatorData] = await Promise.all([
                listChiefBundles(),
                listUnbundledScripts(),
                listChiefEvaluators(),
            ]);
            setBundles(bundleData);
            setUnbundled(unbundledData);
            setEvaluators(evaluatorData);
        } catch (err) {
            setLoadError(err.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleLogout = () => {
        apiLogout();
        navigate("/login");
    };

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPasswordError, setResetPasswordError] = useState("");

    const handleResetPasswordConfirm = async (passwords) => {
        setResetPasswordError("");
        try {
            await changePassword(passwords.currentPassword, passwords.newPassword);
            setShowResetModal(false);
            alert("Password updated successfully.");
        } catch (err) {
            setResetPasswordError(err.message || "Failed to update password.");
        }
    };

    const handleFormBundle = async () => {
        setFormingBundle(true);
        setLoadError("");
        try {
            await formBundle();
            await loadAll();
        } catch (err) {
            setLoadError(err.message || "Failed to form bundle.");
        } finally {
            setFormingBundle(false);
        }
    };

    const handleAssign = async (bundleId, evaluatorId) => {
        if (!evaluatorId) return;
        setAssigningId(bundleId);
        try {
            await assignBundle(bundleId, evaluatorId);
            await loadAll();
        } catch (err) {
            setLoadError(err.message || "Failed to assign bundle.");
        } finally {
            setAssigningId(null);
        }
    };

    // ---- Reviewer ----
    const [reviewers, setReviewers] = useState([]);
    const [reviewersLoading, setReviewersLoading] = useState(true);
    const [isAddReviewerOpen, setIsAddReviewerOpen] = useState(false);
    const [reviewerForm, setReviewerForm] = useState(emptyReviewerForm);
    const [creatingReviewer, setCreatingReviewer] = useState(false);
    const [reviewerError, setReviewerError] = useState("");

    const loadReviewers = async () => {
        setReviewersLoading(true);
        try {
            setReviewers(await listChiefReviewers());
        } catch (err) {
            setReviewerError(err.message || "Failed to load reviewers.");
        } finally {
            setReviewersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "reviewers") loadReviewers();
    }, [activeTab]);

    const handleCreateReviewer = async (e) => {
        e.preventDefault();
        setCreatingReviewer(true);
        setReviewerError("");
        try {
            await createReviewer(reviewerForm);
            setReviewerForm(emptyReviewerForm);
            setIsAddReviewerOpen(false);
            await loadReviewers();
        } catch (err) {
            setReviewerError(err.message || "Failed to create reviewer.");
        } finally {
            setCreatingReviewer(false);
        }
    };

    const availableEvaluators = evaluators.filter((e) => e.available);
    const assignedBundles = bundles.filter((b) => b.valuatorName).length;

    const stats = [
        { label: "Unbundled Sheets", value: unbundled.length, color: "yellow" },
        { label: "Total Bundles", value: bundles.length, color: "blue" },
        { label: "Assigned Bundles", value: assignedBundles, color: "green" },
    ];

    const tabs = [
        { key: "dashboard", label: "Dashboard", icon: SlGraph },
        { key: "reviewers", label: "Reviewer", icon: FiUsers },
        { key: "sheets", label: "Answer Sheets", icon: FiFileText },
    ];

    return (
        <div className="w-full h-screen flex">
            {/* SIDEBAR */}
            <div className="w-60 flex flex-col p-4 mr-0.5 border-r border-gray-300">
                <div className="w-auto flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-full text-blue-600 border border-blue-400 bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer">
                        {userInfo.name.charAt(0)}
                    </div>
                    <div className="w-fit text-center text-blue-600 bg-blue-200 border border-blue-400 font-lexend font-medium text-[0.8em] px-12 py-2 rounded-[0.3em] tracking-wider uppercase">
                        {userInfo.role}
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 mt-8">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`w-full font-lexend font-medium text-[0.85em] px-4 py-2.5 rounded-[0.3em] uppercase tracking-wide cursor-pointer border flex items-center gap-3 transition-colors ${activeTab === tab.key
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={17} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <button onClick={() => setShowResetModal(true)} className="w-full bg-indigo-100 border border-indigo-400 text-indigo-700 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-[0.8em] flex items-center justify-between cursor-pointer hover:bg-indigo-200">
                    <IoLockOpenOutline size={19} />
                    RESET PASSWORD
                </button>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col gap-4">
                {/* HEADER */}
                <div className="w-full p-4 flex justify-between items-center border-b border-gray-200 ml-[-0.2em]">
                    <div className="font-lexend text-[1em] font-medium tracking-wide text-red-600 font-mono">
                        {userInfo.id}
                    </div>
                    <button onClick={handleLogout} className="bg-red-300 border border-red-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-4 tracking-wide cursor-pointer">
                        <IoIosLogOut size={20} />
                        LOGOUT
                    </button>
                </div>

                {loadError && (
                    <p className="font-lexend text-sm text-red-600 px-4">{loadError}</p>
                )}

                {/* DASHBOARD TAB */}
                {activeTab === "dashboard" && (
                    <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto mt-[-1.5em]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Dashboard</h2>
                            <button
                                onClick={handleFormBundle}
                                disabled={formingBundle || unbundled.length === 0}
                                className="flex items-center gap-2 bg-blue-200 border border-blue-500 text-blue-950 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <IoAdd size={18} /> {formingBundle ? "FORMING..." : `FORM BUNDLE (${Math.min(20, unbundled.length)} SHEETS)`}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {stats.map(stat => (
                                <StatCard key={stat.label} value={stat.value} label={stat.label} color={stat.color} />
                            ))}
                        </div>

                        {/* BUNDLES */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-lexend font-bold tracking-wide uppercase text-gray-700">Bundles</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-orange-100 text-[0.85em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                            <th className="border border-gray-400 p-2 w-16">sl no</th>
                                            <th className="border border-gray-400 p-2">bundle id</th>
                                            <th className="border border-gray-400 p-2 w-24">scripts</th>
                                            <th className="border border-gray-400 p-2 w-28">status</th>
                                            <th className="border border-gray-400 p-2">evaluator</th>
                                            <th className="border border-gray-400 p-2 w-56">assign</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading && (
                                            <tr><td colSpan={6} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">Loading...</td></tr>
                                        )}
                                        {!loading && bundles.length === 0 && (
                                            <tr><td colSpan={6} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">No bundles yet - form one from the unbundled answer sheets above.</td></tr>
                                        )}
                                        {!loading && bundles.map((row, idx) => (
                                            <tr key={row.id} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                                <td className="border border-gray-400 p-2">{idx + 1}</td>
                                                <td className="border border-gray-400 p-2 font-mono text-left px-4">{row.bundleCode}</td>
                                                <td className="border border-gray-400 p-2">{row.totalScripts}</td>
                                                <td className="border border-gray-400 p-2">
                                                    <span className="inline-block w-24 bg-gray-100 text-gray-700 font-bold py-1 border border-gray-400 rounded-[0.3em] text-[10px]">{row.status}</span>
                                                </td>
                                                <td className="border border-gray-400 p-2">{row.valuatorName || "-"}</td>
                                                <td className="border border-gray-400 p-1.5">
                                                    {row.valuatorName ? (
                                                        <span className="text-xs text-gray-500">Assigned</span>
                                                    ) : (
                                                        <select
                                                            defaultValue=""
                                                            disabled={assigningId === row.id}
                                                            onChange={(e) => handleAssign(row.id, e.target.value)}
                                                            className="w-full border border-gray-400 rounded-[0.3em] p-1.5 text-[0.85em] font-lexend outline-none cursor-pointer"
                                                        >
                                                            <option value="" disabled>
                                                                {availableEvaluators.length === 0 ? "No evaluators available" : "Assign to..."}
                                                            </option>
                                                            {availableEvaluators.map((ev) => (
                                                                <option key={ev.id} value={ev.id}>{ev.fullName} ({ev.username})</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ANSWER SHEETS TAB (unbundled pool) */}
                {activeTab === "sheets" && (
                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Unbundled Answer Sheets</h2>
                            <button
                                onClick={handleFormBundle}
                                disabled={formingBundle || unbundled.length === 0}
                                className="flex items-center gap-2 bg-blue-200 border border-blue-500 text-blue-950 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <IoAdd size={18} /> {formingBundle ? "FORMING..." : "FORM BUNDLE OF 20"}
                            </button>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                        <th className="border border-gray-400 p-2.5 w-16">sl no</th>
                                        <th className="border border-gray-400 p-2.5">answer booklet id</th>
                                        <th className="border border-gray-400 p-2.5">candidate id</th>
                                        <th className="border border-gray-400 p-2.5">candidate name</th>
                                        <th className="border border-gray-400 p-2.5">qp code</th>
                                        <th className="border border-gray-400 p-2.5">view</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unbundled.length === 0 && (
                                        <tr><td colSpan={6} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">No answer sheets waiting - the scanner hasn't uploaded any yet.</td></tr>
                                    )}
                                    {unbundled.map((s, idx) => (
                                        <tr key={s.id} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                            <td className="border border-gray-400 p-2">{idx + 1}</td>
                                            <td className="border border-gray-400 p-2 font-mono text-left px-4">{s.answerBookletId}</td>
                                            <td className="border border-gray-400 p-2">{s.candidateId}</td>
                                            <td className="border border-gray-400 p-2 text-left px-4">{s.candidateName}</td>
                                            <td className="border border-gray-400 p-2 font-mono">{s.qpCode}</td>
                                            <td className="border border-gray-400 p-1"><button onClick={() => openScript(s)} className="border border-blue-400 bg-blue-100 px-3 py-1 rounded text-xs">PDF</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* REVIEWER TAB */}
                {activeTab === "reviewers" && (
                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        <div className="w-full flex items-center justify-between gap-6">
                            <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Reviewer</h2>
                            {reviewers.length === 0 && (
                                <button
                                    onClick={() => { setIsAddReviewerOpen(true); setReviewerError(""); }}
                                    className="w-48 flex justify-center items-center gap-3 bg-blue-200 text-blue-950 border border-blue-400 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300"
                                >
                                    <IoAdd size={18} /> ADD REVIEWER
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                        <th className="border border-gray-400 p-2.5 w-20">Sl No</th>
                                        <th className="border border-gray-400 p-2.5">UID</th>
                                        <th className="border border-gray-400 p-2.5">Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviewersLoading && (
                                        <tr><td colSpan={3} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">Loading...</td></tr>
                                    )}
                                    {!reviewersLoading && reviewers.length === 0 && (
                                        <tr><td colSpan={3} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">No reviewer created yet for this subject.</td></tr>
                                    )}
                                    {!reviewersLoading && reviewers.map((row, index) => (
                                        <tr key={row.id} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                            <td className="border border-gray-400 p-2">{index + 1}</td>
                                            <td className="border border-gray-400 p-2 text-[1.1em] font-mono font-medium tracking-wide text-left px-4">{row.username}</td>
                                            <td className="border border-gray-400 p-2 text-left px-4">{row.fullName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD REVIEWER MODAL */}
            {isAddReviewerOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-96 rounded-[0.4em] p-6 flex flex-col gap-4">
                        <h3 className="font-lexend font-bold text-lg">Add Reviewer</h3>
                        <form onSubmit={handleCreateReviewer} className="flex flex-col gap-3">
                            <input required placeholder="Username" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={reviewerForm.username} onChange={(e) => setReviewerForm({ ...reviewerForm, username: e.target.value })} />
                            <input required placeholder="Password" type="password" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={reviewerForm.password} onChange={(e) => setReviewerForm({ ...reviewerForm, password: e.target.value })} />
                            <input placeholder="Full Name" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={reviewerForm.fullName} onChange={(e) => setReviewerForm({ ...reviewerForm, fullName: e.target.value })} />
                            {reviewerError && <p className="font-lexend text-sm text-red-600">{reviewerError}</p>}
                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsAddReviewerOpen(false)}
                                    className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={creatingReviewer}
                                    className="bg-blue-200 border border-blue-500 text-blue-950 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                                    {creatingReviewer ? "CREATING..." : "CREATE"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            <ResetPasswordModal
                isOpen={showResetModal}
                onClose={() => { setShowResetModal(false); setResetPasswordError(""); }}
                onConfirm={handleResetPasswordConfirm}
                error={resetPasswordError}
            />
        </div>
    );
}
