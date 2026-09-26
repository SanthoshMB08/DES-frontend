import React, { useState, useMemo } from "react";
import { IoAdd } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";

import AddQpCodeModal from "./AddQPCodeModal";
import PreviewQPDetails from "./PreviewQPDetailsModal";

export default function QpCodesTable({ qpCodes = [], onAddQpCode }) {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // View Management Lifecycle State 
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [selectedQp, setSelectedQp] = useState(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return qpCodes;
        return qpCodes.filter(row =>
            (row.qpCode?.toLowerCase() || "").includes(q) ||
            (row.subject?.toLowerCase() || "").includes(q) ||
            (row.course?.toLowerCase() || "").includes(q) ||
            (row.boeid?.toLowerCase() || "").includes(q)
        );
    }, [qpCodes, search]);

    const handleManageToggle = (row) => {
        // Remap properties cleanly if they use varying cases across structures
        const normalizedData = {
            ...row,
            boeId: row.boeid || row.boeId, // Handles capitalization discrepancies safely
            examDate: row.examinationDate || row.examDate
        };
        setSelectedQp(normalizedData);
        setIsManageOpen(true);
    };

    return (
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="w-full flex items-center justify-between gap-6">
                <div className="w-1/2 flex items-center border border-gray-500 rounded-[0.3em] px-3 py-2.5 gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="SEARCH QP-CODE"
                        className="flex-1 outline-none font-lexend text-[0.9em] px-2.5"
                    />
                    <span className="w-px h-5 bg-gray-500 mr-2" />
                    <FiSearch className="text-gray-500 cursor-pointer" size={18} />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-48 flex justify-center items-center gap-3 bg-blue-200 text-blue-950 border border-blue-400 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300"
                >
                    <IoAdd size={18} /> ADD QP-CODE
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                            <th className="border border-gray-400 p-2.5 w-20">Sl No</th>
                            <th className="border border-gray-400 p-2.5 w-32">QP Code</th>
                            <th className="border border-gray-400 p-2.5">Subject</th>
                            <th className="border border-gray-400 p-2.5 w-28">Course</th>
                            <th className="border border-gray-400 p-2.5 w-28">Semester</th>
                            <th className="border border-gray-400 p-2.5 w-28">Credits</th>
                            <th className="border border-gray-400 p-2.5 w-44">Chief</th>
                            <th className="border border-gray-400 p-2.5 w-28">Booklets</th>
                            <th className="border border-gray-400 p-2.5 w-36">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, index) => (
                            <tr key={row.qpCode ?? index} className="text-[0.9em] font-lexend font-medium h-10 hover:bg-blue-50">
                                <td className="border border-gray-400 px-4 text-center">{row.slNo ?? index + 1}</td>
                                <td className="border border-gray-400 px-4 text-[1.1em] font-mono font-medium tracking-wide text-left">{row.qpCode}</td>
                                <td className="border border-gray-400 px-4 text-left">{row.subject}</td>
                                <td className="border border-gray-400 px-4 text-center">{row.course}</td>
                                <td className="border border-gray-400 px-4 text-center">{row.semester}</td>
                                <td className="border border-gray-400 px-4 text-center">{row.credits}</td>
                                <td className="border border-gray-400 px-4 font-mono text-left">{row.boeid}</td>
                                <td className="border border-gray-400 px-4 text-center">{row.booklets ?? row.examinationDate}</td>
                                <td className="border border-gray-400 p-1.5 text-center">
                                    <button
                                        onClick={() => handleManageToggle(row)}
                                        className="w-36 border border-indigo-400 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-1.5 rounded-[0.3em] text-[0.9em] tracking-wider transition-colors cursor-pointer"
                                    >
                                        MANAGE
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={9} className="border border-gray-400 p-4 text-center font-lexend text-[0.9em] text-gray-500">
                                    No matching QP-codes found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Creation Add Portal Modal */}
            <AddQpCodeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={(data) => {
                    onAddQpCode?.(data);
                    setIsModalOpen(false);
                }}
            />

            {/* Management View Sheet Modal */}
            <PreviewQPDetails
                isOpen={isManageOpen}
                onClose={() => setIsManageOpen(false)}
                selectedBoe={selectedQp}
            />
        </div>
    );
}