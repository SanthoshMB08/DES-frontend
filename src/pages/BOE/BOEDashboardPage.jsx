import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoLockOpenOutline, IoAdd } from "react-icons/io5";
import { SlGraph } from "react-icons/sl";
import { IoIosLogOut } from "react-icons/io";
import StatCard from "../../components/Shared/StatsCard";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";
import { getMyCourse, listMyCourseSubjects, assignChief, completeSubject } from "../../api/valuation";

const emptyChiefForm = { username: "", password: "", fullName: "" };

export default function BOEDashboard() {
    const navigate = useNavigate();
    const session = getSession();

    const userInfo = {
        id: session?.username?.toUpperCase() || "BO",
        name: session?.username || "Board Officer",
        role: "BO"
    };

    const [course, setCourse] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [chiefModalSubject, setChiefModalSubject] = useState(null);
    const [chiefForm, setChiefForm] = useState(emptyChiefForm);
    const [creatingChief, setCreatingChief] = useState(false);
    const [chiefError, setChiefError] = useState("");
    const [completingSubjectId, setCompletingSubjectId] = useState(null);
    const [completionError, setCompletionError] = useState("");

    const loadAll = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const [courseData, subjectData] = await Promise.all([
                getMyCourse(),
                listMyCourseSubjects(),
            ]);
            setCourse(courseData);
            setSubjects(subjectData);
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

    const handleCreateChief = async (e) => {
        e.preventDefault();
        if (!chiefModalSubject) return;
        setCreatingChief(true);
        setChiefError("");
        try {
            await assignChief(chiefModalSubject.subjectId, chiefForm);
            setChiefForm(emptyChiefForm);
            setChiefModalSubject(null);
            await loadAll();
        } catch (err) {
            setChiefError(err.message || "Failed to create Chief.");
        } finally {
            setCreatingChief(false);
        }
    };

    const handleCompleteSubject = async (subject) => {
        if (subject.totalScripts === 0 || subject.reviewedScripts < subject.totalScripts) return;
        if (!window.confirm(
            `Mark ${subject.subjectCode} complete?\n\nThis closes the subject and prevents further valuation edits.`
        )) return;
        setCompletingSubjectId(subject.subjectId);
        setCompletionError("");
        try {
            await completeSubject(subject.subjectId);
            await loadAll();
        } catch (err) {
            setCompletionError(err.message || "Failed to complete subject.");
        } finally {
            setCompletingSubjectId(null);
        }
    };

    const totalPapers = subjects.reduce((acc, s) => acc + (s.totalScripts || 0), 0);
    const totalReviewed = subjects.reduce((acc, s) => acc + (s.reviewedScripts || 0), 0);
    const stats = [
        { label: "Subjects", value: subjects.length, color: "blue" },
        { label: "Total Papers", value: totalPapers, color: "yellow" },
        { label: "Papers Finished", value: totalReviewed, color: "green" },
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
                    <div className="w-full font-lexend font-medium text-[0.85em] px-4 py-2.5 rounded-[0.3em] uppercase tracking-wide border flex items-center gap-3 bg-blue-600 border-blue-600 text-white">
                        <SlGraph size={17} />
                        Dashboard
                    </div>
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

                <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto mt-[-1.5em]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">
                            {course ? `${course.courseName} - Semester ${course.semester}` : "Dashboard"}
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {stats.map(stat => (
                            <StatCard key={stat.label} value={stat.value} label={stat.label} color={stat.color} />
                        ))}
                    </div>

                    {/* SUBJECTS - status of every paper, per subject */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-lexend font-bold tracking-wide uppercase text-gray-700">
                            Subjects &amp; Paper Status
                        </h3>
                        {completionError && <p className="font-lexend text-sm text-red-600">{completionError}</p>}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-orange-100 text-[0.85em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                        <th className="border border-gray-400 p-2">Subject Code</th>
                                        <th className="border border-gray-400 p-2">Subject Name</th>
                                        <th className="border border-gray-400 p-2">QP Code</th>
                                        <th className="border border-gray-400 p-2 w-24">Status</th>
                                        <th className="border border-gray-400 p-2">Chief</th>
                                        <th className="border border-gray-400 p-2 w-40">Papers</th>
                                        <th className="border border-gray-400 p-2 w-44">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr><td colSpan={7} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">Loading...</td></tr>
                                    )}
                                    {!loading && subjects.length === 0 && (
                                        <tr><td colSpan={7} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">No subjects in your course yet - ask the RE to add one.</td></tr>
                                    )}
                                    {!loading && subjects.map((s) => (
                                        <tr key={s.subjectId} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                            <td className="border border-gray-400 p-2 font-mono">{s.subjectCode}</td>
                                            <td className="border border-gray-400 p-2 text-left px-4">{s.subjectName}</td>
                                            <td className="border border-gray-400 p-2 font-mono">{s.qpCode}</td>
                                            <td className="border border-gray-400 p-2">
                                                <span className={`inline-block px-3 py-1 rounded-[0.3em] text-[10px] font-bold border ${s.status === "OPEN" ? "bg-green-100 text-green-700 border-green-400" : "bg-gray-200 text-gray-600 border-gray-400"}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="border border-gray-400 p-2">{s.chiefName || "-"}</td>
                                            <td className="border border-gray-400 p-2">
                                                <div className="flex flex-col items-center leading-tight">
                                                    <span className="text-[11px] text-emerald-700 font-bold">{s.reviewedScripts} finished</span>
                                                    <span className="text-[11px] text-yellow-700 font-bold">{s.totalScripts - s.reviewedScripts} pending</span>
                                                    <span className="text-[10px] text-gray-400">of {s.totalScripts} total</span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-400 p-1.5">
                                                {!s.chiefId ? (
                                                    <button
                                                        onClick={() => { setChiefModalSubject(s); setChiefError(""); }}
                                                        className="w-full flex items-center justify-center gap-2 border border-blue-400 bg-blue-200 hover:bg-blue-300 font-bold py-1.5 rounded-[0.3em] text-[11px] tracking-wider cursor-pointer">
                                                        <IoAdd size={14} /> ASSIGN CHIEF
                                                    </button>
                                                ) : s.status === "OPEN" ? (
                                                    <button
                                                        onClick={() => handleCompleteSubject(s)}
                                                        disabled={s.totalScripts === 0 || s.reviewedScripts < s.totalScripts || completingSubjectId === s.subjectId}
                                                        title={s.totalScripts === 0 || s.reviewedScripts < s.totalScripts ? "All papers must be reviewed before completing this subject" : ""}
                                                        className="w-full flex items-center justify-center gap-2 border border-green-500 bg-green-200 hover:bg-green-300 font-bold py-1.5 rounded-[0.3em] text-[11px] tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {completingSubjectId === s.subjectId ? "SAVING..." : "COMPLETE"}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-bold text-green-700">COMPLETED</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ASSIGN CHIEF MODAL */}
            {chiefModalSubject && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-96 rounded-[0.4em] p-6 flex flex-col gap-4">
                        <h3 className="font-lexend font-bold text-lg">Assign Chief for {chiefModalSubject.subjectCode}</h3>
                        <form onSubmit={handleCreateChief} className="flex flex-col gap-3">
                            <input required placeholder="Username" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={chiefForm.username} onChange={(e) => setChiefForm({ ...chiefForm, username: e.target.value })} />
                            <input required placeholder="Password" type="password" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={chiefForm.password} onChange={(e) => setChiefForm({ ...chiefForm, password: e.target.value })} />
                            <input placeholder="Full Name" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                                value={chiefForm.fullName} onChange={(e) => setChiefForm({ ...chiefForm, fullName: e.target.value })} />
                            {chiefError && <p className="font-lexend text-sm text-red-600">{chiefError}</p>}
                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setChiefModalSubject(null)}
                                    className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={creatingChief}
                                    className="bg-blue-200 border border-blue-500 text-blue-950 px-6 py-2 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60">
                                    {creatingChief ? "CREATING..." : "CREATE"}
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
