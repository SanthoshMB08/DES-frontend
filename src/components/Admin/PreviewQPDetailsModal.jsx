import React, { useState } from "react";
import { IoClose, IoCloudUploadOutline } from "react-icons/io5";

import { AiOutlineDelete } from "react-icons/ai";
import { HiOutlineViewfinderCircle } from "react-icons/hi2";

import PDFPreviewModal from "../Shared/PDFViewer";

export default function PreviewQPDetails({ isOpen, onClose, selectedBoe }) {
    const [uploadedFiles, setUploadedFiles] = useState({
        questionPaper: null,
        qpSolution: null,
    });

    // Control state for handling the sub file-viewer modal instance
    const [previewTarget, setPreviewTarget] = useState({
        isOpen: false,
        url: "",
        name: ""
    });

    if (!isOpen || !selectedBoe) return null;

    const handleFileChange = (e, fieldKey) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFiles((prev) => ({
                ...prev,
                [fieldKey]: {
                    name: file.name,
                    url: URL.createObjectURL(file),
                },
            }));
        }
    };

    const removeFile = (fieldKey) => {
        setUploadedFiles((prev) => ({
            ...prev,
            [fieldKey]: null,
        }));
    };

    // Activates inner modal sequence context
    const openEmbeddedPreview = (fileObj) => {
        setPreviewTarget({
            isOpen: true,
            url: fileObj.url,
            name: fileObj.name
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[0.3em] shadow-lg flex flex-col max-h-[85vh]">

                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 shrink-0">
                    <h3 className="font-lexend font-medium text-lg text-white">
                        {selectedBoe.qpCode}
                    </h3>
                </div>

                {/* Modal Body Container with Hidden Scrollbars */}
                <div className="p-6 overflow-y-auto flex flex-col gap-8 font-lexend text-[0.95em] 
                    [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {/* SECTION 1: QP INFORMATION */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            QP INFORMATION
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">qp-code</span>
                                <span className="font-mono font-medium text-gray-800">{selectedBoe.qpCode || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Subject</span>
                                <span className="font-medium text-gray-800">{selectedBoe.subject || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Course</span>
                                <span className="font-medium text-gray-800">{selectedBoe.course || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Semester</span>
                                <span className="font-medium text-gray-800">{selectedBoe.semester || "N/A"}</span>
                            </div>
                            {/* New Fields Requested */}
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Credits</span>
                                <span className="font-medium text-gray-800">{selectedBoe.credits || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Date of Examination</span>
                                <span className="font-medium text-gray-800">{selectedBoe.examDate || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">BOE ID</span>
                                <span className="font-mono font-medium text-gray-800">{selectedBoe.boeId || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">BOE Name</span>
                                <span className="font-medium text-gray-800">{selectedBoe.boeName || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: QP CODE RESOURCES */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            QP RESOURCES
                        </h4>
                        <div className="grid grid-cols-2 gap-4">

                            {/* Input Field A: Question Paper */}
                            <div className="border border-gray-200 rounded p-4 bg-gray-50 h-[115px] flex flex-col justify-between box-border">
                                {uploadedFiles.questionPaper ? (
                                    <>
                                        <p className="text-xs text-gray-600 font-mono font-medium uppercase tracking-wider truncate" title={uploadedFiles.questionPaper.name}>
                                            {uploadedFiles.questionPaper.name}
                                        </p>
                                        <div className="flex gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => removeFile("questionPaper")}
                                                className="flex justify-center items-center gap-1 bg-red-50 border border-red-400 text-red-700 font-medium px-3 py-1.5 rounded-[0.3em] text-xs tracking-wider hover:bg-red-100 transition-colors cursor-pointer"
                                                title="Delete File"
                                            >
                                                <AiOutlineDelete size={14} /> DELETE
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEmbeddedPreview(uploadedFiles.questionPaper)}
                                                className="flex-1 flex justify-center items-center gap-4 bg-blue-50 border border-blue-400 text-blue-700 font-medium py-1.5 rounded-[0.3em] text-xs tracking-wider hover:bg-blue-100 transition-colors cursor-pointer"
                                            >
                                                <HiOutlineViewfinderCircle size={14} /> PREVIEW
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider">
                                            upload qp
                                        </span>
                                        <label className="flex justify-center items-center gap-2.5 border border-dashed border-gray-300 bg-white rounded px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
                                            <IoCloudUploadOutline size={18} className="text-gray-400 shrink-0" />
                                            <span className="text-xs text-gray-500 font-normal truncate">SELECT A PDF FILE</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, "questionPaper")}
                                            />
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* Input Field B: QP Solution */}
                            <div className="border border-gray-200 rounded p-4 bg-gray-50 h-[115px] flex flex-col justify-between box-border">
                                {uploadedFiles.qpSolution ? (
                                    <>
                                        <p className="text-xs text-gray-600 font-mono font-medium uppercase tracking-wider truncate" title={uploadedFiles.qpSolution.name}>
                                            {uploadedFiles.qpSolution.name}
                                        </p>
                                        <div className="flex gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => removeFile("qpSolution")}
                                                className="flex justify-center items-center gap-1 bg-red-50 border border-red-400 text-red-700 font-medium px-3 py-1.5 rounded-[0.3em] text-xs tracking-wider hover:bg-red-100 transition-colors cursor-pointer"
                                                title="Delete File"
                                            >
                                                <AiOutlineDelete size={14} /> DELETE
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEmbeddedPreview(uploadedFiles.qpSolution)}
                                                className="flex-1 flex justify-center items-center gap-4 bg-blue-50 border border-blue-400 text-blue-700 font-medium py-1.5 rounded-[0.3em] text-xs tracking-wider hover:bg-blue-100 transition-colors cursor-pointer"
                                            >
                                                <HiOutlineViewfinderCircle size={14} /> PREVIEW
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider">
                                            upload qp solution
                                        </span>
                                        <label className="flex justify-center items-center gap-2.5 border border-dashed border-gray-300 bg-white rounded px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
                                            <IoCloudUploadOutline size={18} className="text-gray-400 shrink-0" />
                                            <span className="text-xs text-gray-500 font-normal truncate">SELECT A PDF FILE</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, "qpSolution")}
                                            />
                                        </label>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* SECTION 3: QP VALUATION STATS */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            QP valuations stats
                        </h4>
                        <div className="overflow-x-auto border border-gray-700">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-700 font-bold uppercase tracking-wider text-center border-b border-gray-700">
                                        <th className="border-r border-gray-700 p-2.5 text-blue-700">Total Booklets</th>
                                        <th className="border-r border-gray-700 p-2.5 text-green-700">Valuated</th>
                                        <th className="border-r border-gray-700 p-2.5 text-amber-700">Pending</th>
                                        <th className="p-2.5 text-red-700">Rejected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-center font-semibold text-gray-800 h-11">
                                        <td className="border-r border-gray-700 p-2 text-blue-600">{selectedBoe.booklets ?? 0}</td>
                                        <td className="border-r border-gray-700 p-2 text-green-600">{selectedBoe.valuated ?? 0}</td>
                                        <td className="border-r border-gray-700 p-2 text-amber-600">{selectedBoe.pending ?? 0}</td>
                                        <td className="p-2 text-red-600 bg-red-50/10">{selectedBoe.rejected ?? 0}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-12 py-2 mr-3.5 border border-gray-400 bg-gray-200 text-gray-700 font-medium rounded-[0.3em] text-sm tracking-wide transition-colors cursor-pointer"
                    >
                        CLOSE
                    </button>
                </div>

            </div>

            {/* Inner File Layer Modal Portal */}
            <PDFPreviewModal
                isOpen={previewTarget.isOpen}
                fileUrl={previewTarget.url}
                fileName={previewTarget.name}
                onClose={() => setPreviewTarget(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}