import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiLock, FiLayers, FiFileText } from "react-icons/fi";

import { RxLockClosed } from "react-icons/rx";
import { IoIosLogOut } from "react-icons/io";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import { listValuatorBundles, listValuatorBundleScripts, submitValuatorBundle, toggleAvailability, getMyAvailability } from "../../api/valuation";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";

export default function ValuatorDashboard() {
    const navigate = useNavigate();
    const session = getSession();

    const userInfo = {
        id: session?.username?.toUpperCase() || "VALUATOR",
        name: session?.username || "Valuator",
        role: "valuator"
    };

    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [submittingBundleId, setSubmittingBundleId] = useState(null);

    const loadBundles = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const assignedBundles = await listValuatorBundles();
            const populatedBundles = await Promise.all(assignedBundles.map(async (bundle) => ({
                ...bundle,
                scripts: await listValuatorBundleScripts(bundle.id),
            })));
            setBundles(populatedBundles);
        } catch (err) {
            setLoadError(err.message || "Failed to load bundles.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBundles();
    }, [loadBundles]);

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

    const [available, setAvailable] = useState(true);
    const [togglingAvailability, setTogglingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const me = await getMyAvailability();
                setAvailable(me.available);
            } catch {
                // Non-fatal - keep the default and let the toggle button correct it.
            }
        })();
    }, []);

    const handleToggleAvailability = async () => {
        setTogglingAvailability(true);
        setAvailabilityError("");
        try {
            const result = await toggleAvailability();
            setAvailable(result.available);
        } catch (err) {
            setAvailabilityError(err.message || "Failed to update availability.");
        } finally {
            setTogglingAvailability(false);
        }
    };

    const handleValuate = (paper) => {
        navigate(`/valuation?bundleId=${paper.bundleId}&scriptId=${paper.id}`);
    };

    const handleSubmitBundle = async (bundle) => {
        const pendingCount = bundle.scripts.filter((script) => script.status === "PENDING").length;
        const message = pendingCount > 0
            ? `Submit bundle ${bundle.bundleCode}? ${pendingCount} unfinished paper(s) will return to the unbundled pool. Completed papers will stay in this bundle.`
            : `Submit bundle ${bundle.bundleCode} for review?`;
        if (!window.confirm(message)) return;

        setSubmittingBundleId(bundle.id);
        setLoadError("");
        try {
            const returnedCount = await submitValuatorBundle(bundle.id);
            if (returnedCount > 0) {
                alert(`${returnedCount} unfinished paper(s) returned to the unbundled pool. Completed papers remain in this bundle.`);
            } else {
                alert("Bundle submitted for review.");
            }
            await loadBundles();
            const me = await getMyAvailability();
            setAvailable(me.available);
        } catch (err) {
            setLoadError(err.message || "Failed to submit bundle.");
        } finally {
            setSubmittingBundleId(null);
        }
    };

    // Derived Metrics Calculations
    const papers = bundles.flatMap((bundle) => bundle.scripts);
    const totalScriptsEvaluated = papers.filter((paper) => paper.status !== "PENDING").length;
    const pendingScripts = papers.filter((paper) => paper.status === "PENDING").length;

    return (
        // CONTAINER
        <div className="w-full h-screen flex">

            {/* SIDEBAR CONTAINER */}
            <div className="w-60 flex flex-col justify-between p-4 mr-0.5 border-r border-gray-300">

                {/* PROFILE-ICON & LABLE */}
                <div className="flex items-center gap-3">
                    {/* AVATAR */}
                    <div className="w-12 h-12 rounded-full text-blue-600 border border-blue-400 bg-blue-100 flex items-center justify-center font-bold text-lg cursor-pointer">
                        {userInfo.name.charAt(0)}
                    </div>
                    {/* TAG */}
                    <div className="w-fit text-center text-blue-600 bg-blue-200 border border-blue-400 font-lexend font-medium text-[0.8em] px-9 py-2 rounded-[0.3em] tracking-wider uppercase ">
                        {userInfo.role}
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
                        <span>ID : <span className="font-bold text-red-700">{userInfo.id}</span></span>
                        <span className="text-gray-600">|</span>
                        <span className=" text-[1em] font-normal">{userInfo.name}</span>
                    </div>

                    {/* AVAILABILITY + LOGOUT BTNS */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleAvailability}
                            disabled={togglingAvailability}
                            className={`px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm border tracking-wide cursor-pointer disabled:opacity-60 ${available ? "bg-green-200 border-green-500 text-green-800" : "bg-gray-200 border-gray-400 text-gray-600"
                                }`}
                        >
                            {togglingAvailability ? "..." : available ? "AVAILABLE" : "UNAVAILABLE"}
                        </button>
                        <button onClick={handleLogout} className="bg-red-300 border border-red-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-4 tracking-wide cursor-pointer">
                            <IoIosLogOut size={20} />
                            LOGOUT
                        </button>
                    </div>
                </div>
                {availabilityError && (
                    <p className="font-lexend text-sm text-red-600 px-4">{availabilityError}</p>
                )}



                {/* DASHBOARD CONTENT BODY */}
                <div className="flex-1 p-6 flex flex-col gap-6 mt-[-0.5em]">
                    <div>
                        <h2 className="text-xl font-lexend font-bold tracking-wide uppercase">Dashboard</h2>
                    </div>

                    {/* METRIC CARDS GRID */}
                    <div className="grid grid-cols-4 gap-6">

                        {/* CARD-1 */}
                        <div className=" font-lexend border bg-green-100 border-green-400 p-4 rounded-[0.3em] flex flex-col justify-between">
                            <span className="text-4xl font-bold tracking-tight text-green-700 ">{String(totalScriptsEvaluated).padStart(2, '0')}</span>
                            <span className="text-[0.75em] font-bold uppercase text-green-700 mt-2">Total Scripts Valuated</span>
                        </div>

                        {/* CARD-2 */}
                        <div className="font-lexend border bg-yellow-100 border-yellow-400 p-4 rounded-[0.3em] flex flex-col justify-between">
                            <span className="text-4xl font-bold text-yellow-600 tracking-tight">{String(pendingScripts).padStart(2, '0')}</span>
                            <span className="text-[0.75em] font-bold uppercase text-yellow-600 mt-2">Pending Scripts</span>
                        </div>
                    </div>


                    {loadError && !loading && (
                        <p className="font-lexend text-sm text-red-600">{loadError}</p>
                    )}
                    <div className="flex-1 overflow-y-auto space-y-5">
                        {loading && <p className="p-4 text-center font-lexend text-sm text-gray-500">Loading bundles...</p>}
                        {!loading && !loadError && bundles.length === 0 && (
                            <p className="border border-gray-300 p-4 text-center font-lexend text-sm text-gray-500">No papers assigned yet.</p>
                        )}
                        {!loading && bundles.map((bundle) => {
                            const completedCount = bundle.scripts.filter((script) => script.status !== "PENDING").length;
                            const pendingCount = bundle.scripts.length - completedCount;
                            const alreadySubmitted = bundle.status !== "PENDING";

                            return (
                                <section key={bundle.id} className="border border-gray-300 rounded-md overflow-hidden">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3">
                                        <div>
                                            <h3 className="font-lexend font-bold tracking-wide">{bundle.bundleCode}</h3>
                                            <p className="text-sm text-gray-600">
                                                {bundle.course} · Semester {bundle.semester} · {bundle.qpCode}
                                                {bundle.createdAt ? ` · Assigned ${new Date(bundle.createdAt).toLocaleDateString()}` : ""}
                                            </p>
                                        </div>
                                        <span className="font-lexend text-sm font-semibold">
                                            {completedCount} / {bundle.scripts.length} papers completed
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                                    <th className="border border-gray-300 p-2.5 w-20">sl no</th>
                                                    <th className="border border-gray-300 p-2.5">paper / booklet id</th>
                                                    <th className="border border-gray-300 p-2.5">qp-code</th>
                                                    <th className="border border-gray-300 p-2.5 w-32">status</th>
                                                    <th className="border border-gray-300 p-2.5 w-44">action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bundle.scripts.map((paper, index) => (
                                                    <tr key={paper.id} className="text-[0.95em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                                        <td className="border border-gray-300 p-2">{index + 1}</td>
                                                        <td className="border border-gray-300 p-2 text-[1.1em] font-mono text-left px-4">{paper.answerBookletId}</td>
                                                        <td className="border border-gray-300 p-2">{paper.qpCode}</td>
                                                        <td className="border border-gray-300 p-2">
                                                            <span className={`inline-block min-w-24 font-bold py-1 border rounded-[0.3em] text-[10px] ${paper.status === "PENDING" ? "bg-yellow-100 text-yellow-700 border-yellow-400" : "bg-green-200 text-green-800 border-green-400"}`}>
                                                                {paper.status}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 p-1.5">
                                                            {paper.status === "PENDING" ? (
                                                                <button
                                                                    onClick={() => handleValuate(paper)}
                                                                    className="w-40 border border-blue-400 bg-blue-200 hover:bg-blue-300 font-bold py-1.5 rounded-[0.3em] text-[12px] tracking-wider transition-colors cursor-pointer active:translate-y-0.5">
                                                                    OPEN PAPER
                                                                </button>
                                                            ) : <span className="text-gray-500">COMPLETED</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-300">
                                        <p className="text-sm text-gray-600">
                                            {alreadySubmitted
                                                ? "Bundle submitted for review."
                                                : `${pendingCount} unfinished paper(s) stay assigned until this bundle is submitted.`}
                                        </p>
                                        {alreadySubmitted ? (
                                            <span className="rounded border border-green-400 bg-green-100 px-4 py-2 text-xs font-bold tracking-wide text-green-800">SUBMITTED</span>
                                        ) : (
                                            <button
                                                onClick={() => handleSubmitBundle(bundle)}
                                                disabled={submittingBundleId === bundle.id}
                                                className="rounded border border-green-500 bg-green-200 px-5 py-2 text-xs font-bold tracking-wide text-green-900 hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60">
                                                {submittingBundleId === bundle.id ? "SUBMITTING..." : "SUBMIT BUNDLE"}
                                            </button>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>

            </div>

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
