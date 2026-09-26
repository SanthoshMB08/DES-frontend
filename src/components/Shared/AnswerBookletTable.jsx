import React, { useState, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
// Import the modal component here
import PreviewBookletModal from "./PreviewBookletModal";

export default function AnswerBookletsTable({ answerBooklets }) {
    const [search, setSearch] = useState("");

    // Modal State Management
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooklet, setSelectedBooklet] = useState(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return answerBooklets;
        return answerBooklets.filter(row =>
            row.bookletId?.toLowerCase().includes(q) ||
            row.candidateId?.toLowerCase().includes(q) ||
            row.qpCode?.toLowerCase().includes(q) ||
            row.course?.toLowerCase().includes(q)
        );
    }, [answerBooklets, search]);

    const handlePreviewClick = (booklet) => {
        setSelectedBooklet(booklet);
        setIsModalOpen(true);
    };

    return (
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="w-full flex items-center justify-between gap-6">
                <div className="w-1/2 flex items-center border border-gray-500 rounded-[0.3em] px-3 py-2.5 gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="SEARCH ANSWER BOOKLET"
                        className="flex-1 outline-none font-lexend text-[0.9em] px-2.5"
                    />
                    <span className="w-px h-5 bg-gray-500 mr-2" />
                    <FiSearch className="text-gray-500 cursor-pointer" size={18} />
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                            <th className="border border-gray-400 p-2.5 w-20">Sl No</th>
                            <th className="border border-gray-400 p-2.5">Booklet ID</th>
                            <th className="border border-gray-400 p-2.5">Candidate ID</th>
                            <th className="border border-gray-400 p-2.5">Course</th>
                            <th className="border border-gray-400 p-2.5">Semester</th>
                            <th className="border border-gray-400 p-2.5">Qp-code</th>
                            <th className="border border-gray-400 p-2.5 w-40">Status</th>
                            <th className="border border-gray-400 p-2.5 w-28">Marks</th>
                            <th className="border border-gray-400 p-2.5 w-36">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, index) => (
                            <tr key={row.bookletId ?? index} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                <td className="border border-gray-400 p-2">{row.slNo}</td>
                                <td className="border border-gray-400 p-2 text-[1.1em] font-mono font-medium tracking-wide text-left px-4">{row.bookletId}</td>
                                <td className="border border-gray-400 p-2">{row.candidateId}</td>
                                <td className="border border-gray-400 p-2">{row.course}</td>
                                <td className="border border-gray-400 p-2">{row.semester}</td>
                                <td className="border border-gray-400 p-2 font-mono">{row.qpCode}</td>
                                <td className="border border-gray-400 p-2">
                                    {row.status === "valuated" && (
                                        <span className="inline-block w-28 bg-blue-100 text-blue-800 font-bold py-1 border border-blue-400 rounded-[0.3em] text-[10px]">VALUATED</span>
                                    )}
                                    {row.status === "reviewed" && (
                                        <span className="inline-block w-28 bg-emerald-100 text-emerald-800 font-bold py-1 border border-emerald-400 rounded-[0.3em] text-[10px]">REVIEWED</span>
                                    )}
                                    {row.status === "pending" && (
                                        <span className="inline-block w-28 bg-yellow-100 text-yellow-700 font-bold py-1 border border-yellow-400 rounded-[0.3em] text-[10px]">PENDING</span>
                                    )}
                                </td>
                                <td className="border border-gray-400 p-2 font-mono">{row.finalMarks}</td>
                                <td className="border border-gray-400 p-1.5 text-center">
                                    <button
                                        onClick={() => handlePreviewClick(row)}
                                        className="w-36 border border-indigo-400 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-1.5 rounded-[0.3em] text-[0.9em] tracking-wider transition-colors cursor-pointer"
                                    >
                                        PREVIEW
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className="border border-gray-400 p-4 text-center font-lexend text-[0.9em] text-gray-500">
                                    No matching booklets found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Render Modal */}
            <PreviewBookletModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedBooklet={selectedBooklet}
            />
        </div>
    );
}