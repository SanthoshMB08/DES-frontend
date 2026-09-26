import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SlGraph } from "react-icons/sl";
import { FiUsers } from "react-icons/fi";
import { IoAdd } from "react-icons/io5";

import { RxLockClosed } from "react-icons/rx";
import { IoIosLogOut } from "react-icons/io";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";
import {
    listReviewerBundles,
    createEvaluator,
    listReviewerEvaluators,
} from "../../api/valuation";

const emptyEvaluatorForm = { username: "", password: "", fullName: "" };
const MAX_EVALUATORS = 4;

export default function ReviewerDashboard() {
    const navigate = useNavigate();
    const session = getSession();

    const userInfo = {
        id: session?.username?.toUpperCase() || "REVIEWER",
        name: session?.username || "Reviewer",
        role: "reviewer"
    };

    const [activeTab, setActiveTab] = useState("dashboard");

    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    // REVIEWED / APPROVED bundles show as "valuated" (done) here; everything else is pending review.
    const toUiStatus = (status) => (status === "REVIEWED" || status === "APPROVED" ? "valuated" : "pending");

    const loadBundles = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const data = await listReviewerBundles();
            setBundles(
                data.map((b, idx) => ({
                    slNo: idx + 1,
                    id: b.id,
                    packetId: b.bundleCode,
                    valuatedOn: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "",
                    valuatorId: b.valuatorName || "-",
                    course: b.course,
                    semester: b.semester,
                    qpcode: b.qpCode,
                    totalScripts: b.totalScripts,
                    status: toUiStatus(b.status)
                }))
            );
        } catch (err) {
            setLoadError(err.message || "Failed to load bundles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBundles();
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

    // Review is deliberately one script at a time: the reviewer must see the PDF and
    // can correct marks before that script is locked.
    const handleReview = (bundle) => {
        navigate(`/valuation?bundleId=${bundle.id}&mode=review`);
    };

    // ---- Evaluators (Reviewer creates up to 4) ----
    const [evaluators, setEvaluators] = useState([]);
    const [evaluatorsLoading, setEvaluatorsLoading] = useState(true);
    const [isAddEvaluatorOpen, setIsAddEvaluatorOpen] = useState(false);
    const [evaluatorForm, setEvaluatorForm] = useState(emptyEvaluatorForm);
    const [creatingEvaluator, setCreatingEvaluator] = useState(false);
    const [evaluatorError, setEvaluatorError] = useState("");

    const loadEvaluators = async () => {
        setEvaluatorsLoading(true);
        try {
            setEvaluators(await listReviewerEvaluators());
        } catch (err) {
            setEvaluatorError(err.message || "Failed to load evaluators.");
        } finally {
            setEvaluatorsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "evaluators") loadEvaluators();
    }, [activeTab]);

    const handleCreateEvaluator = async (e) => {
        e.preventDefault();
        setCreatingEvaluator(true);
        setEvaluatorError("");
        try {
            await createEvaluator(evaluatorForm);
            setEvaluatorForm(emptyEvaluatorForm);
            setIsAddEvaluatorOpen(false);
            await loadEvaluators();
        } catch (err) {
            setEvaluatorError(err.message || "Failed to create evaluator.");
        } finally {
            setCreatingEvaluator(false);
        }
    };

    // Derived Metrics Calculations
    const totalScriptsEvaluated = bundles.filter(b => b.status === "valuated").reduce((acc, b) => acc + (Number(b.totalScripts) || 0), 0);
    const pendingScripts = bundles.filter(b => b.status === "pending").reduce((acc, b) => acc + (Number(b.totalScripts) || 0), 0);

    const tabs = [
        { key: "dashboard", label: "Dashboard", icon: SlGraph },
        { key: "evaluators", label: "Evaluators", icon: FiUsers },
    ];

    return (
        // CONTAINER
        <div className="w-full h-screen flex">

            {/* SIDEBAR CONTAINER */}
            <div className="w-60 flex flex-col justify-between p-4 mr-0.5 border-r border-gray-300">

                {/* PROFILE-ICON & LABLE */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full text-blue-600 border border-blue-400 bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer">
                            {userInfo.name.charAt(0)}
                        </div>
                        <div className="w-fit text-center text-blue-600 bg-blue-200 border border-blue-400 font-lexend font-medium text-[0.8em] px-9 py-2 rounded-[0.3em] tracking-wider uppercase ">
                            {userInfo.role}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
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
                </div>

                {/* RESET PASSWORD BTN */}
                <button onClick={() => setShowResetModal(true)} className="w-full bg-red-300 border border-red-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center justify-between cursor-pointer hover:bg-red-400 transition-colors">
                    <RxLockClosed size={17} />
                    RESET &nbsp;PASSWORD
                </button>
            </div>


            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col gap-4">

                {/* HEADER ROW */}
                <div className="w-full p-4 flex justify-between items-center border-b border-gray-200 ml-[-0.2em]">

                    {/* IDENTITY */}
                    <div className=" font-lexend text-[1.1em] font-medium tracking-wide flex gap-4">
                        <span>ID : <span className="font-medium text-red-700">{userInfo.id}</span></span>
                        <span className="text-gray-600">|</span>
                        <span className=" text-[1em] font-normal">{userInfo.name}</span>
                    </div>

                    {/* LOGOUT BTN */}
                    <button onClick={handleLogout} className="bg-red-300 border border-red-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-4 tracking-wide cursor-pointer">
                        <IoIosLogOut size={20} />
                        LOGOUT
                    </button>
                </div>

                {/* DASHBOARD TAB */}
                {activeTab === "dashboard" && (
                    <div className="flex-1 p-6 flex flex-col gap-6 mt-[-0.5em] overflow-y-auto">
                        <div>
                            <h2 className="text-xl font-lexend font-bold tracking-wide uppercase">Dashboard</h2>
                        </div>

                        {/* METRIC CARDS GRID */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className=" font-lexend border bg-green-100 border-green-400 p-4 rounded-[0.3em] flex flex-col justify-between">
                                <span className="text-4xl font-bold tracking-tight text-green-700 ">{String(totalScriptsEvaluated).padStart(2, '0')}</span>
                                <span className="text-[0.75em] font-bold uppercase text-green-700 mt-2">Total Scripts Reviewed</span>
                            </div>
                            <div className="font-lexend border bg-yellow-100 border-yellow-400 p-4 rounded-[0.3em] flex flex-col justify-between">
                                <span className="text-4xl font-bold text-yellow-600 tracking-tight">{String(pendingScripts).padStart(2, '0')}</span>
                                <span className="text-[0.75em] font-bold uppercase text-yellow-600 mt-2">Pending Scripts</span>
                            </div>
                        </div>

                        {/* DATA TABLE CONTAINER */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-orange-100 text-[0.95em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                        <th className="border border-gray-400 p-2.5 w-20">sl no</th>
                                        <th className="border border-gray-400 p-2.5 w-44">packet id</th>
                                        <th className="border border-gray-400 p-2.5 w-38">valuated on</th>
                                        <th className="border border-gray-400 p-2.5">evaluator</th>
                                        <th className="border border-gray-400 p-2.5">course</th>
                                        <th className="border border-gray-400 p-2.5">sem</th>
                                        <th className="border border-gray-400 p-2.5">qp-code</th>
                                        <th className="border border-gray-400 p-2.5 w-24">total</th>
                                        <th className="border border-gray-400 p-2.5 w-28">status</th>
                                        <th className="border border-gray-400 p-2.5 w-44">action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={10} className="border border-gray-400 p-4 text-center font-lexend text-sm text-gray-500">Loading bundles...</td>
                                        </tr>
                                    )}
                                    {!loading && loadError && (
                                        <tr>
                                            <td colSpan={10} className="border border-gray-400 p-4 text-center font-lexend text-sm text-red-600">{loadError}</td>
                                        </tr>
                                    )}
                                    {!loading && !loadError && bundles.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="border border-gray-400 p-4 text-center font-lexend text-sm text-gray-500">No bundles awaiting review.</td>
                                        </tr>
                                    )}
                                    {!loading && !loadError && bundles.map((row, index) => (
                                        <tr key={index} className="text-[0.9em] font-lexend font-normal text-center h-10 hover:bg-blue-50">
                                            <td className="border border-gray-400 p-2">{row.slNo}</td>
                                            <td className="border border-gray-400 p-2 text-[1.1em] font-mono font-medium tracking-wide text-left px-4">{row.packetId}</td>
                                            <td className="border border-gray-400 p-2">{row.valuatedOn}</td>
                                            <td className="border border-gray-400 p-2">{row.valuatorId}</td>
                                            <td className="border border-gray-400 p-2">{row.course}</td>
                                            <td className="border border-gray-400 p-2">{row.semester}</td>
                                            <td className="border border-gray-400 p-2">{row.qpcode}</td>
                                            <td className="border border-gray-400 p-2">{row.totalScripts}</td>

                                            <td className="border border-gray-400 p-2">
                                                {row.status === "valuated" && (
                                                    <span className="inline-block w-28 bg-green-200 text-green-800 font-bold py-1 border border-green-400 rounded-[0.3em] text-[10px]">
                                                        VALUATED
                                                    </span>
                                                )}
                                                {row.status === "pending" && (
                                                    <span className="inline-block w-28 bg-yellow-100 text-yellow-700 font-bold py-1 border border-yellow-400 rounded-[0.3em] text-[10px]">
                                                        PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-gray-400 p-1.5">
                                                {row.status === "valuated" && (
                                                    <button className="w-40 border border-green-400 bg-green-200 font-bold py-1.5 rounded-[0.3em] text-[12px] tracking-wider cursor-no-drop">
                                                        SUBMITTED
                                                    </button>
                                                )}
                                                {row.status === "pending" && (
                                                    <button
                                                        onClick={() => handleReview(row)}
                                                        className="w-40 border border-blue-400 bg-blue-200 hover:bg-blue-300 font-bold py-1.5 rounded-[0.3em] text-[12px] tracking-wider transition-colors cursor-pointer active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        REVIEW
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* EVALUATORS TAB */}
                {activeTab === "evaluators" && (
                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        <div className="w-full flex items-center justify-between gap-6">
                            <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">
                                Evaluators ({evaluators.length}/{MAX_EVALUATORS})
                            </h2>
                            <button
                                onClick={() => { setIsAddEvaluatorOpen(true); setEvaluatorError(""); }}
                                disabled={evaluators.length >= MAX_EVALUATORS}
                                className="w-48 flex justify-center items-center gap-3 bg-blue-200 text-blue-950 border border-blue-400 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <IoAdd size={18} /> ADD EVALUATOR
                            </button>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                        <th className="border border-gray-400 p-2.5 w-20">Sl No</th>
                                        <th className="border border-gray-400 p-2.5">UID</th>
                                        <th className="border border-gray-400 p-2.5">Name</th>
                                        <th className="border border-gray-400 p-2.5 w-40">Availability</th>
                                        <th className="border border-gray-400 p-2.5">Active Bundle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evaluatorsLoading && (
                                        <tr><td colSpan={5} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">Loading...</td></tr>
                                    )}
                                    {!evaluatorsLoading && evaluators.length === 0 && (
                                        <tr><td colSpan={5} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">No evaluators created yet.</td></tr>
                                    )}
                                    {!evaluatorsLoading && evaluators.map((row, index) => (
                                        <tr key={row.id} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                            <td className="border border-gray-400 p-2">{index + 1}</td>
                                            <td className="border border-gray-400 p-2 text-[1.1em] font-mono font-medium tracking-wide text-left px-4">{row.username}</td>
                                            <td className="border border-gray-400 p-2 text-left px-4">{row.fullName}</td>
                                            <td className="border border-gray-400 p-2">
                                                <span className={`inline-block w-28 font-bold py-1 border rounded-[0.3em] text-[10px] ${row.available ? "bg-green-200 text-green-800 border-green-400" : "bg-gray-200 text-gray-600 border-gray-400"}`}>
                                                    {row.available ? "AVAILABLE" : "BUSY"}
                                                </span>
                                            </td>
                                            <td className="border border-gray-400 p-2 font-mono">{row.activeBundleCode || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD EVALUATOR MODAL */}
            {isAddEvaluatorOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-96 rounded-[0.4em] p-6 flex flex-col gap-4">
                        <h3 className="font-lexend font-bold text-lg">Add Evaluator</h3>
                        <form onSubmit={handleCreateEvaluator} className="flex flex-col gap-3">
                            <input required placeholder="Username" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={evaluatorForm.username} onChange={(e) => setEvaluatorForm({ ...evaluatorForm, username: e.target.value })} />
                            <input required placeholder="Password" type="password" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={evaluatorForm.password} onChange={(e) => setEvaluatorForm({ ...evaluatorForm, password: e.target.value })} />
                            <input placeholder="Full Name" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={evaluatorForm.fullName} onChange={(e) => setEvaluatorForm({ ...evaluatorForm, fullName: e.target.value })} />
                            {evaluatorError && <p className="font-lexend text-sm text-red-600">{evaluatorError}</p>}
                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsAddEvaluatorOpen(false)}
                                    className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={creatingEvaluator}
                                    className="bg-blue-200 border border-blue-500 text-blue-950 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                                    {creatingEvaluator ? "CREATING..." : "CREATE"}
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
