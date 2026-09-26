import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaFilePdf } from "react-icons/fa6";
// Import your custom PDF viewer modal component here
import PDFPreviewModal from "./PDFViewer";
import { getScannerScriptFile } from "../../api/valuation";

export default function PreviewBookletModal({ isOpen, onClose, selectedBooklet }) {
    // Local state to manage opening the inner PDF viewer modal
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
    const [pdfObjectUrl, setPdfObjectUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState("");

    // Revoke any previously created object URL so we don't leak memory across previews.
    useEffect(() => {
        return () => {
            if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
        };
    }, [pdfObjectUrl]);

    if (!isOpen || !selectedBooklet) return null;

    const handlePreviewClick = async () => {
        setPdfError("");
        // If the row already carries a direct URL, use it as-is.
        if (selectedBooklet.pdfUrl) {
            setIsPdfViewerOpen(true);
            return;
        }
        // Otherwise fetch the real scanned copy from the backend using its scriptId.
        if (!selectedBooklet.scriptId) {
            setPdfError("No scanned copy is linked to this booklet yet.");
            return;
        }
        setPdfLoading(true);
        try {
            const blob = await getScannerScriptFile(selectedBooklet.scriptId);
            const url = URL.createObjectURL(blob);
            setPdfObjectUrl(url);
            setIsPdfViewerOpen(true);
        } catch (err) {
            setPdfError(err.message || "Failed to load the scanned booklet.");
        } finally {
            setPdfLoading(false);
        }
    };

    const pdfToRender = selectedBooklet.pdfUrl || pdfObjectUrl;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[0.3em] shadow-lg flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 shrink-0 rounded-t-[0.3em]">
                    <h3 className="font-lexend font-medium text-[1em.1] text-white">
                        {selectedBooklet.bookletId}
                    </h3>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex flex-col gap-8 font-lexend text-[0.95em]
                    [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {/* SECTION 1: Candidate & Booklet Meta Information */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            CANDIDATE INFORMATION
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Candidate ID</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.candidateId || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Candidate Name</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.candidateName || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Course</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.course || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Semester</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.semester || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Answer Booklet ID</span>
                                <span className="font-mono font-medium text-gray-800">{selectedBooklet.bookletId || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">QP Code</span>
                                <span className="font-mono font-medium text-gray-800">{selectedBooklet.qpCode || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Subject</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.subject || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Date of Exam (DOE)</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.doe || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Scanned On</span>
                                <span className="font-medium text-gray-800">{selectedBooklet.scannedOn || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Status</span>
                                <span className="font-bold text-gray-800 uppercase text-xs">{selectedBooklet.status || "N/A"}</span>
                            </div>

                            {/* NEW FIELD: Interactive PDF Action Trigger Button */}
                            <div className="col-span-2 border border-blue-300 rounded p-2.5 bg-blue-100 flex items-center justify-between mt-1">
                                <div className="pl-2">
                                    <span className="text-xs text-blue-700 block uppercase font-bold tracking-wider mb-0.5">Digital Archive</span>
                                    <span className="text-xs text-gray-800">SCANED ASNWER BOOKLET</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePreviewClick}
                                    disabled={pdfLoading}
                                    className="flex items-center gap-2 px-5 py-2 rounded font-normal text-xs tracking-wide transition-all uppercase shadow-sm border bg-blue-700 border-blue-800 text-white hover:bg-blue-800 cursor-pointer disabled:opacity-60"
                                >
                                    {pdfLoading ? "LOADING..." : "PREVIEW"}
                                </button>
                            </div>
                            {pdfError && (
                                <div className="col-span-2 text-xs text-red-600 font-medium px-1">{pdfError}</div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: Script History Layout */}
                    <div className="flex flex-col gap-5">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            BOOKLET HISTORY
                        </h4>

                        {/* BOE Info Block row */}
                        <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 border border-amber-200 rounded">
                            <div>
                                <span className="text-xs text-gray-500 block font-medium uppercase tracking-wider">BOE ID</span>
                                <span className="font-mono font-semibold text-gray-800">{selectedBooklet.boeId || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium uppercase tracking-wider">BOE Name</span>
                                <span className="font-semibold text-gray-800">{selectedBooklet.boeName || "N/A"}</span>
                            </div>
                        </div>

                        {/* Valuator Table */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">Valuator Stage </span>
                            <div className="overflow-x-auto border border-gray-700">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-amber-100 text-xs text-gray-900 font-medium uppercase tracking-wider text-center border-b border-gray-700">
                                            <th className="border-r border-gray-700 p-2.5">Valuated On</th>
                                            <th className="border-r border-gray-700 p-2.5">Valuator ID</th>
                                            <th className="border-r border-gray-700 p-2.5">Valuator Name</th>
                                            <th className="p-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="text-center text-gray-600 h-10 border-b border-gray-700 last:border-b-0">
                                            <td className="border-r border-gray-700 p-2 text-xs">{selectedBooklet.valuatedOn || "N/A"}</td>
                                            <td className="border-r border-gray-700 p-2 font-mono text-xs">{selectedBooklet.valuatorId || "N/A"}</td>
                                            <td className="border-r border-gray-700 p-2 text-left px-4">{selectedBooklet.valuatorName || "N/A"}</td>
                                            <td className="p-2 font-semibold text-xs text-blue-600 uppercase">{selectedBooklet.valuatorStatus || "N/A"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Reviewer Table */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">Reviewer Stage</span>
                            <div className="overflow-x-auto border border-gray-700">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-amber-100 text-xs text-gray-900 font-medium uppercase tracking-wider text-center border-b border-gray-700">
                                            <th className="border-r border-gray-700 p-2.5">Reviewed On</th>
                                            <th className="border-r border-gray-700 p-2.5">Reviewer ID</th>
                                            <th className="border-r border-gray-700 p-2.5">Reviewer Name</th>
                                            <th className="p-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="text-center text-gray-600 h-10 border-b border-gray-700 last:border-b-0">
                                            <td className="border-r border-gray-700 p-2 text-xs">{selectedBooklet.reviewedOn || "N/A"}</td>
                                            <td className="border-r border-gray-700 p-2 font-mono text-xs">{selectedBooklet.reviewerId || "N/A"}</td>
                                            <td className="border-r border-gray-700 p-2 text-left px-4">{selectedBooklet.reviewerName || "N/A"}</td>
                                            <td className="p-2 font-semibold text-xs text-emerald-600 uppercase">{selectedBooklet.reviewerStatus || "N/A"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Final Marks Breakdown Matrix */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            MARKS MATRIX
                        </h4>
                        <div className="overflow-x-auto border border-gray-700">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-700 font-bold uppercase tracking-wider text-center border-b border-gray-700">
                                        <th className="border-r border-gray-700 p-2.5 w-20">Sl No</th>
                                        <th className="border-r border-gray-700 p-2.5 text-blue-700">Valuator Marks</th>
                                        <th className="border-r border-gray-700 p-2.5 text-emerald-700">Reviewer Marks</th>
                                        <th className="border-r border-gray-700 p-2.5 text-indigo-700">Final Marks</th>
                                        <th className="p-2.5">Result Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-center font-semibold text-gray-800 h-11">
                                        <td className="border-r border-gray-700 p-2 text-xs text-gray-500">1</td>
                                        <td className="border-r border-gray-700 p-2 text-blue-600">{selectedBooklet.valuatorMarks ?? "-"}</td>
                                        <td className="border-r border-gray-700 p-2 text-emerald-600">{selectedBooklet.reviewerMarks ?? "-"}</td>
                                        <td className="border-r border-gray-700 p-2 text-indigo-600">{selectedBooklet.finalMarks ?? "-"}</td>
                                        <td className="p-2">
                                            {selectedBooklet.finalStatus?.toLowerCase() === "pass" ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 text-xs rounded font-bold">PASS</span>
                                            ) : selectedBooklet.finalStatus?.toLowerCase() === "fail" ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 text-xs rounded font-bold">FAIL</span>
                                            ) : (
                                                <span className="text-gray-400 font-medium">-</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0 rounded-b-[0.3em]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-12 py-2 mr-2 border border-gray-400 bg-gray-200 text-gray-700 font-medium rounded-[0.3em] text-sm tracking-wide transition-colors hover:bg-gray-300 cursor-pointer"
                    >
                        CLOSE
                    </button>
                </div>

            </div>

            {/* Render your PDF Viewer modal with the valid demo target */}
            <PDFPreviewModal
                isOpen={isPdfViewerOpen}
                onClose={() => setIsPdfViewerOpen(false)}
                fileUrl={pdfToRender}
                fileName={selectedBooklet?.fileName || selectedBooklet?.bookletId || "Answer booklet"}
            />
        </div>
    );
}
