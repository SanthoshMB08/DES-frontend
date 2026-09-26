import React, { useState, useEffect } from "react";
import { FiSearch, FiUpload, FiLoader } from "react-icons/fi";
import { lookupBooklet } from "../../api/valuation";

const UploadBooklettModal = ({
    isOpen,
    onClose,
    scriptForm,
    handleScriptFormChange,
    handleFileChange,
    handleAddScript,
    error,
    isSubmitting,
    // Bumped by the parent after each successful add so the modal drops its
    // read-only lock and success banner, ready for the next booklet.
    resetKey
}) => {
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState("");
    // Once a booklet number resolves, the student/exam fields are server-owned
    // and the scanner is only left to attach the PDF.
    const [isResolved, setIsResolved] = useState(false);
    const [addedNotice, setAddedNotice] = useState("");

    // Hooks must run before an early return so opening/closing this modal does
    // not change React's hook order.
    useEffect(() => {
        if (isOpen) {
            setIsResolved(false);
            setLookupError("");
            setAddedNotice("");
        }
    }, [isOpen]);

    // The parent resets the form in place after a successful add, so clear the
    // lock and show the confirmation without waiting for the modal to reopen.
    useEffect(() => {
        if (resetKey > 0) {
            setIsResolved(false);
            setLookupError("");
            setAddedNotice("Booklet added successfully. Enter the next booklet number to continue.");
        }
    }, [resetKey]);

    if (!isOpen) return null;

    const runLookup = async () => {
        const bookletId = scriptForm.answerBookletId?.trim();
        if (!bookletId) return;
        setLookupLoading(true);
        setLookupError("");
        try {
            const result = await lookupBooklet(bookletId);
            if (result) {
                const syn = (name, value) => ({ target: { name, value } });
                if (result.candidateId) handleScriptFormChange(syn("candidateId", result.candidateId));
                if (result.candidateName) handleScriptFormChange(syn("candidateName", result.candidateName));
                if (result.qpCode) handleScriptFormChange(syn("qpId", result.qpCode));
                if (result.course) handleScriptFormChange(syn("course", result.course));
                if (result.semester) handleScriptFormChange(syn("semester", String(result.semester)));
                if (result.subject) handleScriptFormChange(syn("subject", result.subject));
                if (result.examDate) handleScriptFormChange(syn("examDate", result.examDate));
                if (result.centerCode) handleScriptFormChange(syn("centerCode", result.centerCode));
                setIsResolved(true);
            }
        } catch (err) {
            setLookupError(err.message || "Booklet not found");
            setIsResolved(false);
        } finally {
            setLookupLoading(false);
        }
    };

    // Pressing Enter in the booklet field searches, rather than submitting the
    // form with the remaining fields still blank.
    const handleBookletKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            runLookup();
        }
    };

    // A changed booklet number invalidates everything filled from the old one.
    const handleBookletChange = (e) => {
        if (isResolved) {
            setIsResolved(false);
            setLookupError("");
        }
        handleScriptFormChange(e);
    };

    const lockedField = "bg-gray-100 text-gray-600 cursor-not-allowed";
    const fieldClass = (locked) =>
        `border rounded-sm px-4 py-2.5 font-lexend text-sm outline-none ${
            locked ? `${lockedField} border-gray-300` : "border-gray-400 bg-white"
        }`;

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="w-full max-w-xl bg-white border border-amber-300 rounded-sm flex flex-col shadow-xl">
                <div className="flex justify-between items-center bg-amber-200 px-6 py-5 rounded-t-sm">
                    <h3 className="font-lexend font-medium uppercase tracking-wide">UPLOAD ANSWER BOOKLET</h3>
                </div>
                <div className="p-8">
                    <form onSubmit={handleAddScript} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-lexend text-xs font-bold uppercase text-gray-600">Answer Booklet ID</label>
                            <div className="flex items-center border border-gray-400 rounded-sm bg-white">
                                <input
                                    type="text"
                                    name="answerBookletId"
                                    value={scriptForm.answerBookletId}
                                    onChange={handleBookletChange}
                                    onKeyDown={handleBookletKeyDown}
                                    placeholder="TYPE BOOKLET NUMBER AND PRESS ENTER"
                                    autoFocus
                                    className="flex-1 px-4 py-2.5 font-lexend text-sm outline-none bg-transparent"
                                    required
                                />
                                <div className="w-px h-6 bg-gray-300" />
                                <button type="button" onClick={runLookup} disabled={lookupLoading || !scriptForm.answerBookletId?.trim()} className="w-11 h-10 flex items-center justify-center bg-white text-gray-500 cursor-pointer rounded-r-sm disabled:opacity-40">
                                    {lookupLoading ? <FiLoader size={16} className="animate-spin" /> : <FiSearch size={16} />}
                                </button>
                            </div>
                            {lookupError && <p className="font-lexend text-xs text-amber-600">{lookupError}</p>}
                            {addedNotice && (
                                <p className="font-lexend text-xs text-green-700">{addedNotice}</p>
                            )}
                            {isResolved && (
                                <p className="font-lexend text-xs text-green-700">
                                    Details filled in automatically - attach the scanned PDF to continue.
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-lexend text-xs font-bold uppercase text-gray-700">Candidate ID</label>
                                <input type="text" name="candidateId" value={scriptForm.candidateId} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-lexend text-xs font-bold uppercase text-gray-700">QP Code</label>
                                <input type="text" name="qpId" value={scriptForm.qpId} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} required />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-lexend text-xs font-bold uppercase text-gray-700">Candidate Name</label>
                            <input type="text" name="candidateName" value={scriptForm.candidateName} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-lexend text-xs font-bold uppercase text-gray-700">Course</label>
                                <input type="text" name="course" value={scriptForm.course || ""} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-lexend text-xs font-bold uppercase text-gray-700">Semester</label>
                                <input type="text" name="semester" value={scriptForm.semester || ""} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-lexend text-xs font-bold uppercase text-gray-700">Subject</label>
                                <input type="text" name="subject" value={scriptForm.subject || ""} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-lexend text-xs font-bold uppercase text-gray-700">Exam Date</label>
                                <input type="text" name="examDate" value={scriptForm.examDate || ""} onChange={handleScriptFormChange} readOnly={isResolved} placeholder="YYYY-MM-DD" className={fieldClass(isResolved)} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-lexend text-xs font-bold uppercase text-gray-700">Centre Code</label>
                            <input type="text" name="centerCode" value={scriptForm.centerCode || ""} onChange={handleScriptFormChange} readOnly={isResolved} className={fieldClass(isResolved)} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-lexend text-xs font-bold uppercase text-gray-700">Select Scanned Answer Booklet</label>
                            <label htmlFor="scannedFile" className="border border-dashed border-gray-400 rounded-sm px-4 py-5 font-lexend text-sm bg-white flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-50">
                                <FiUpload size={18} className="text-gray-500" />
                                <span className="text-gray-600">{scriptForm.scannedFile ? scriptForm.scannedFile.name : "CLICK TO SELECT SCANNED PDF"}</span>
                            </label>
                            <input id="scannedFile" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                        </div>
                        {error && <p className="font-lexend text-sm text-red-600">{error}</p>}
                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={onClose} className="bg-gray-100 border border-gray-400 text-gray-700 px-10 py-2.5 rounded-sm font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-gray-200">CANCEL</button>
                            <button type="submit" disabled={isSubmitting} className="bg-blue-200 border border-blue-500 text-blue-950 px-12 py-2.5 rounded-sm font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300 disabled:opacity-60">{isSubmitting ? "ADDING..." : "ADD BOOKLET"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadBooklettModal;
