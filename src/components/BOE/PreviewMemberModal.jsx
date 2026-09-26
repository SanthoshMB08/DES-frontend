import React from "react";

export default function PreviewMemberModal({ isOpen, onClose, selectedMember }) {
    if (!isOpen || !selectedMember) return null;

    // Use dummy/fallback values if workHistory isn't defined
    const workHistory = selectedMember.workHistory || [
        { slNo: 1, date: "05-JUL-2026", packetId: "PKT-BCA-501-A", bookletValuated: 12 },
        { slNo: 2, date: "06-JUL-2026", packetId: "PKT-BCA-501-B", bookletValuated: 15 },
        { slNo: 3, date: "07-JUL-2026", packetId: "PKT-BCA-502-A", bookletValuated: 8 },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[0.3em] shadow-lg flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 shrink-0 rounded-t-[0.3em]">
                    <h3 className="font-lexend font-normal text-[1em] text-white uppercase">
                        {selectedMember.name}
                    </h3>
                </div>

                {/* Modal Body Container */}
                <div className="p-6 overflow-y-auto flex flex-col gap-8 font-lexend text-[0.95em] 
                    [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {/* SECTION 1: Member Information */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            MEMBER INFORMATION
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">UID</span>
                                <span className="font-mono font-medium text-gray-800">{selectedMember.boeId || selectedMember.uid || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Role</span>
                                <span className="font-medium text-gray-800 uppercase">{selectedMember.role || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Name</span>
                                <span className="font-medium text-gray-800">{selectedMember.name || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Email</span>
                                <span className="font-medium text-gray-800">{selectedMember.email || `${selectedMember.name?.toLowerCase().replace(/\s+/g, "")}@example.com`}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">qp-code</span>
                                <span className="font-mono font-medium text-gray-800">{selectedMember.qpCode || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Subject</span>
                                <span className="font-medium text-gray-800">{selectedMember.subject || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Course</span>
                                <span className="font-medium text-gray-800">{selectedMember.course || "N/A"}</span>
                            </div>
                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Semester</span>
                                <span className="font-medium text-gray-800">{selectedMember.semester || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1.5: BOE & Supervisor Info */}
                    <div className="flex flex-col gap-4">
                        {/* BOE details for both Valuator and Reviewer */}
                        <div className="border border-amber-300 rounded p-3.5 bg-amber-50/40 flex flex-col gap-2">
                            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">BOE Details</span>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-amber-200/60 rounded p-3 bg-white">
                                    <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">BOE ID</span>
                                    <span className="font-mono font-medium text-gray-800">{selectedMember.boeId || "BOE-001"}</span>
                                </div>
                                <div className="border border-amber-200/60 rounded p-3 bg-white">
                                    <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">BOE Name</span>
                                    <span className="font-medium text-gray-800">{selectedMember.boeName || "Dr. Suresh Rao"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Supervisor details only for Valuator */}
                        {selectedMember.role?.toLowerCase() === "valuator" && (
                            <div className="border border-blue-300 rounded p-3.5 bg-blue-50/40 flex flex-col gap-2">
                                <span className="text-xs text-blue-800 font-bold uppercase tracking-wider">Reviewer Details</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-blue-200/60 rounded p-3 bg-white">
                                        <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Reviewer ID</span>
                                        <span className="font-mono font-medium text-gray-800">{selectedMember.supervisorId || "N/A"}</span>
                                    </div>
                                    <div className="border border-blue-200/60 rounded p-3 bg-white">
                                        <span className="text-xs text-gray-500 block uppercase font-medium tracking-wider mb-0.5">Reviewer Name</span>
                                        <span className="font-medium text-gray-800">{selectedMember.supervisorName || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: Work History */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-red-800 border-b pb-1">
                            HISTORY
                        </h4>
                        <div className="overflow-x-auto border border-gray-700">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-amber-100 text-xs text-gray-900 font-bold uppercase tracking-wider text-center border-b border-gray-700">
                                        <th className="border-r border-gray-700 p-2.5 w-16">SL NO</th>
                                        <th className="border-r border-gray-700 p-2.5">Date</th>
                                        <th className="border-r border-gray-700 p-2.5">Packet ID</th>
                                        <th className="p-2.5">Booklet Valuated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workHistory.map((work, idx) => (
                                        <tr key={idx} className="text-center text-gray-600 h-10 hover:bg-gray-50 border-b border-gray-700 last:border-b-0">
                                            <td className="border-r border-gray-700 p-2 text-xs text-gray-500">{work.slNo || idx + 1}</td>
                                            <td className="border-r border-gray-700 p-2 text-xs">{work.date}</td>
                                            <td className="border-r border-gray-700 p-2 font-mono text-xs">{work.packetId}</td>
                                            <td className="p-2 font-semibold text-xs text-blue-600">{work.bookletValuated}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0 rounded-b-[0.3em]">
                    <button
                        onClick={onClose}
                        className="px-12 py-2 mr-2 border border-gray-400 bg-gray-200 text-gray-700 font-medium rounded-[0.3em] text-sm tracking-wide transition-colors cursor-pointer"
                    >
                        CLOSE
                    </button>
                </div>

            </div>
        </div>
    );
}
