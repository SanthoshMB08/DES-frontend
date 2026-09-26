import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiPlus, FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";
import { RxLockClosed } from "react-icons/rx";
import { IoIosLogOut } from "react-icons/io";

// Component imports
import UploadBooklettModal from "../../components/Scanner/UploadBookletModal";
import LogoutModal from "../../components/Shared/LogoutModal";
import ResetPasswordModal from "../../components/Shared/ResetPasswordModal";

import { getSession } from "../../api/client";
import { logout as apiLogout, changePassword } from "../../api/auth";
import { createScript, listMyScannedScripts, uploadScannedFile, getScannerScriptFile } from "../../api/valuation";

export default function ScannerDashboard() {
    const navigate = useNavigate();
    const session = getSession();
    const userInfo = {
        id: session?.username?.toUpperCase() || "SCANNER",
        name: session?.username || "Scanner",
        role: "SCANNER"
    };

    // SCAN SCRIPT FORM STATE
    const emptyScriptForm = {
        answerBookletId: "",
        candidateId: "",
        candidateName: "",
        qpId: "",
        subject: "",
        examDate: "",
        course: "",
        semester: "",
        centerCode: "",
        scannedFile: null
    };

    const [scriptForm, setScriptForm] = useState(emptyScriptForm);
    const [addResetKey, setAddResetKey] = useState(0);
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const mapScriptResponse = (s, idx) => ({
        slNo: idx + 1,
        id: s.id,
        answerBookletId: s.answerBookletId,
        candidateId: s.candidateId,
        candidateName: s.candidateName,
        qpcode: s.qpCode,
        subject: s.subject,
        examDate: s.examDate,
        course: s.course,
        semester: s.semester,
        centerCode: s.centerCode,
        scannedFileName: s.scannedFileName
    });

    const loadScripts = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const data = await listMyScannedScripts();
            setScripts(data.map(mapScriptResponse));
        } catch (err) {
            setLoadError(err.message || "Failed to load scripts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadScripts();
    }, []);

    // MODAL VISIBILITY CONTROL STATES
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // SEARCH STATE
    const [searchQuery, setSearchQuery] = useState("");

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const SCRIPTS_PER_PAGE = 8;

    const handleScriptFormChange = (e) => {
        const { name, value } = e.target;
        setScriptForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setScriptForm((prev) => ({ ...prev, scannedFile: file }));
    };

    const [addError, setAddError] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [viewError, setViewError] = useState("");

    const handleViewScript = async (scriptId) => {
        setViewError("");
        try {
            const blob = await getScannerScriptFile(scriptId);
            window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch (err) {
            setViewError(err.message || "Failed to load the scanned PDF.");
        }
    };

    const handleAddScript = async (e) => {
        e.preventDefault();
        if (!scriptForm.answerBookletId || !scriptForm.candidateId) {
            setAddError("Answer Booklet ID and Candidate ID are required.");
            return;
        }
        if (!scriptForm.qpId) {
            setAddError("QP Code is required.");
            return;
        }
        if (!scriptForm.scannedFile) {
            setAddError("Please attach the scanned PDF.");
            return;
        }

        setIsAdding(true);
        setAddError("");
        try {
            const created = await createScript({
                answerBookletId: scriptForm.answerBookletId,
                candidateId: scriptForm.candidateId,
                candidateName: scriptForm.candidateName,
                qpCode: scriptForm.qpId,
                subject: scriptForm.subject,
                examDate: scriptForm.examDate || null,
                course: scriptForm.course,
                semester: scriptForm.semester,
                centerCode: scriptForm.centerCode,
                scannedFileName: scriptForm.scannedFile.name
            });
            // Upload the actual PDF bytes - this is what the evaluator will later see
            // auto-loaded in their viewer, no manual upload on their end.
            await uploadScannedFile(created.id, scriptForm.scannedFile);
            await loadScripts();
            // Stay on the add-booklet screen after a successful add so a stack of
            // booklets can be scanned in one pass; the scanner dismisses it with
            // Cancel when done.
            setScriptForm(emptyScriptForm);
            setAddError("");
            setAddResetKey((k) => k + 1);
        } catch (err) {
            setAddError(err.message || "Failed to add script.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleLogoutConfirm = () => {
        setShowLogoutModal(false);
        apiLogout();
        navigate("/login");
    };

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

    // Derived Metrics
    const totalScriptsCount = scripts.length;
    const totalQpCodes = useMemo(() => {
        const codes = new Set(scripts.map((s) => s.qpcode).filter(Boolean));
        return codes.size;
    }, [scripts]);

    const filteredScripts = useMemo(() => {
        if (!searchQuery.trim()) return scripts;
        const q = searchQuery.trim().toLowerCase();
        return scripts.filter((s) =>
            Object.values(s).some((val) => {
                if (val instanceof File) return false;
                return String(val).toLowerCase().includes(q);
            })
        );
    }, [scripts, searchQuery]);

    // PAGINATION DERIVED VALUES
    const totalPages = Math.max(1, Math.ceil(filteredScripts.length / SCRIPTS_PER_PAGE));

    const paginatedScripts = useMemo(() => {
        const start = (currentPage - 1) * SCRIPTS_PER_PAGE;
        return filteredScripts.slice(start, start + SCRIPTS_PER_PAGE);
    }, [filteredScripts, currentPage]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const goToPrevPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    return (
        <div className="w-full h-screen flex">

            {/* SIDEBAR CONTAINER */}
            <div className="w-60 flex flex-col justify-between p-4 mr-0.5 border-r border-gray-300">
                <div className="flex flex-col gap-12">
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-12 rounded-full text-purple-600 border border-purple-400 bg-purple-100 flex items-center justify-center font-bold text-lg cursor-pointer">
                            {userInfo.name.charAt(0)}
                        </div>
                        <div className="w-full text-center text-purple-800 bg-purple-200 border border-purple-400 font-lexend font-medium text-[0.8em] py-2 rounded-[0.3em] tracking-wider uppercase ">
                            {userInfo.role}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="font-lexend border bg-blue-100 border-blue-400 p-4 rounded-[0.3em] flex flex-col justify-between">
                            <span className="text-4xl font-bold tracking-tight text-blue-700">{String(totalScriptsCount).padStart(2, '0')}</span>
                            <span className="text-[0.75em] font-bold uppercase text-blue-700 mt-2">Total Scripts</span>
                        </div>

                        <div className="font-lexend border bg-pink-100 border-pink-400 p-4 rounded-[0.3em] flex flex-col justify-between">
                            <span className="text-4xl font-bold tracking-tight text-pink-600">{String(totalQpCodes).padStart(2, '0')}</span>
                            <span className="text-[0.75em] font-bold uppercase text-pink-600 mt-2">Total QP Codes</span>
                        </div>
                    </div>
                </div>

                {/* RESET PASSWORD BTN LINKED */}
                <button
                    onClick={() => setShowResetModal(true)}
                    className="w-full bg-red-300 border border-red-500 px-4 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center justify-between cursor-pointer hover:bg-red-400 transition-colors"
                >
                    <RxLockClosed size={17} />
                    RESET &nbsp;PASSWORD
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">

                {/* HEADER ROW */}
                <div className="w-full p-4 flex justify-between items-center border-b border-gray-200 ml-[-0.2em]">
                    <div className=" font-lexend text-[1.1em] font-medium tracking-wide flex gap-4">
                        <span>ID : <span className="font-bold text-red-700">{userInfo.id}</span></span>
                        <span className="text-gray-600">|</span>
                        <span className=" text-[1em] font-normal">{userInfo.name}</span>
                    </div>

                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="bg-red-300 border border-red-500 px-6 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm flex items-center gap-4 tracking-wide cursor-pointer hover:bg-red-400 transition-colors"
                    >
                        <IoIosLogOut size={20} />
                        LOGOUT
                    </button>
                </div>

                {/* MAIN : SCRIPTS */}
                <div className="flex-1 p-6 flex flex-col gap-6 mt-[-1em]">
                    <div>
                        <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Manage Scripts</h2>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="relative max-w-md w-full">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="BOOKLET ID"
                                className="w-3/4 pl-12 pr-3 py-2.5 border border-gray-400 rounded-[0.3em] font-lexend text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-200 border border-blue-400 text-blue-900 px-3 py-2.5 rounded-[0.3em] font-lexend font-medium text-[0.9em] tracking-wide flex items-center gap-2 cursor-pointer hover:bg-blue-300 transition-colors"
                        >
                            <FiPlus size={17} />
                            ADD SCRIPT
                        </button>
                    </div>

                    {viewError && (
                        <p className="font-lexend text-sm text-red-600 px-1">{viewError}</p>
                    )}

                    {/* SCRIPTS TABLE */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                    <th className="border border-gray-400 p-2.5 w-20">sl no</th>
                                    <th className="border border-gray-400 p-2.5 w-44">booklet id</th>
                                    <th className="border border-gray-400 p-2.5 w-40">candidate id</th>
                                    <th className="border border-gray-400 p-2.5 w-28">course</th>
                                    <th className="border border-gray-400 p-2.5 w-28">semester</th>
                                    <th className="border border-gray-400 p-2.5 w-28">qp-code</th>
                                    <th className="border border-gray-400 p-2.5 w-28">doe</th>
                                    <th className="border border-gray-400 p-2.5 w-40">center code</th>
                                    <th className="border border-gray-400 p-2.5 w-24">preview</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="border border-gray-400 p-4 text-center font-lexend text-sm text-gray-500">
                                            Loading scripts...
                                        </td>
                                    </tr>
                                ) : loadError ? (
                                    <tr>
                                        <td colSpan={9} className="border border-gray-400 p-4 text-center font-lexend text-sm text-red-600">
                                            {loadError}
                                        </td>
                                    </tr>
                                ) : paginatedScripts.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="border border-gray-400 p-4 text-center font-lexend text-sm text-gray-500">
                                            {scripts.length === 0 ? "No scripts entered yet." : "No scripts match your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedScripts.map((row) => (
                                        <tr key={row.slNo} className="text-[0.9em] font-lexend font-normal text-center h-10 hover:bg-blue-50">
                                            <td className="border border-gray-400 p-2">{row.slNo}</td>
                                            <td className="border border-gray-400 p-2 font-mono text-left px-4">{row.answerBookletId}</td>
                                            <td className="border border-gray-400 p-2">{row.candidateId}</td>
                                            <td className="border border-gray-400 p-2">{row.course}</td>
                                            <td className="border border-gray-400 p-2">{row.semester}</td>
                                            <td className="border border-gray-400 p-2">{row.qpcode}</td>
                                            <td className="border border-gray-400 p-2">{row.examDate}</td>
                                            <td className="border border-gray-400 p-2">{row.centerCode}</td>
                                            <td className="border border-gray-400 p-1.5">
                                                <button
                                                    onClick={() => handleViewScript(row.id)}
                                                    title="View scanned PDF"
                                                    className="mx-auto flex items-center justify-center gap-1 border border-blue-400 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-[0.3em] text-[11px] font-medium cursor-pointer"
                                                >
                                                    <FiEye size={13} /> VIEW
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    <div className="flex justify-end items-center gap-3">
                        <span className="font-lexend text-[0.85em] font-medium text-gray-600 tracking-wide">
                            BOOKLET
                            [ {filteredScripts.length === 0 ? 0 : (currentPage - 1) * SCRIPTS_PER_PAGE + 1}
                            {" - "}
                            {Math.min(currentPage * SCRIPTS_PER_PAGE, filteredScripts.length)} ] / {filteredScripts.length}
                        </span>

                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 cursor-pointer hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronLeft size={17} />
                        </button>

                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 cursor-pointer hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiChevronRight size={17} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ANSWER BOOKLET MODAL */}
            <UploadBooklettModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setScriptForm(emptyScriptForm);
                    setAddError("");
                }}
                scriptForm={scriptForm}
                handleScriptFormChange={handleScriptFormChange}
                handleFileChange={handleFileChange}
                handleAddScript={handleAddScript}
                error={addError}
                isSubmitting={isAdding}
                resetKey={addResetKey}
            />

            {/* LOGOUT CONFIRMATION MODAL */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogoutConfirm}
            />

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