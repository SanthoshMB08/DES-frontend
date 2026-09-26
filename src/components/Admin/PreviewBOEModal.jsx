import React from "react";
import { IoClose } from "react-icons/io5";

export default function PreviewBOEModal({ isOpen, onClose, selectedBoe }) {
    if (!isOpen || !selectedBoe) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[0.3em] shadow-lg flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 shrink-0">
                    <h3 className="font-lexend font-medium text-lg text-white">
                        {selectedBoe.boeId}
                    </h3>
                </div>

                {/* Modal Body Container with Hidden Scrollbars */}
                <div className="p-6 overflow-y-auto flex flex-col gap-8 font-lexend text-[0.95em] 
                    [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {/* SECTION 1: Meta Information Boxes */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            QP INFORMATION
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">BOE ID</span>
                                <span className="font-mono font-medium text-gray-800">{selectedBoe.boeId || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Name</span>
                                <span className="font-medium text-gray-800">{selectedBoe.name || "N/A"}</span>
                            </div>
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
                        </div>
                    </div>

                    {/* SECTION 2: Subordinates Table */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            SUBORDINATES
                        </h4>
                        <div className="overflow-x-auto border border-gray-700">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-amber-100 text-xs text-gray-900 font-medium uppercase tracking-wider text-center border-b border-gray-700">
                                        <th className="border-r border-gray-700 p-2.5 w-16">SL NO</th>
                                        <th className="border-r border-gray-700 p-2.5 w-32">Role</th>
                                        <th className="border-r border-gray-700 p-2.5 w-40">UID</th>
                                        <th className="border-r border-gray-700 p-2.5">Name</th>
                                        <th className="border-r border-gray-700 p-2.5 w-24">Valuated</th>
                                        <th className="p-2.5 w-24">Pending</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBoe.allotments && selectedBoe.allotments.length > 0 ? (
                                        selectedBoe.allotments.map((allotment, idx) => (
                                            <tr key={idx} className="text-center text-gray-600 h-10 hover:bg-gray-50 border-b border-gray-700 last:border-b-0">
                                                <td className="border-r border-gray-700 p-2 text-xs text-gray-500">{idx + 1}</td>
                                                <td className="border-r border-gray-700 p-2 font-medium">{allotment.role}</td>
                                                <td className="border-r border-gray-700 p-2 font-mono text-xs text-gray-700">{allotment.uid}</td>
                                                <td className="border-r border-gray-700 p-2 text-left px-4">{allotment.name}</td>
                                                <td className="border-r border-gray-700 p-2 text-green-600 font-semibold">{allotment.valuated ?? 0}</td>
                                                <td className="p-2 text-amber-600 font-semibold">{allotment.pending ?? 0}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-5 font-lexend text-xs text-center text-red-400">
                                                NO DATA FOUND !
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 3: Final Matrix Metric Summary */}
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
        </div>
    );
}