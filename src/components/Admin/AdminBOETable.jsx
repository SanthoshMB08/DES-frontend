import React, { useState, useMemo } from "react";
import { IoAdd } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";

import AddBoeModal from "./AddBOEModal";
import PreviewBOEModal from "./PreviewBOEModal";

export default function BoeTable({ boeList = [], qpCodes = [], onAddBoe }) {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Management Modal State
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [selectedBoe, setSelectedBoe] = useState(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return boeList;
        return boeList.filter(row =>
            (row.boeId?.toLowerCase() || "").includes(q) ||
            (row.name?.toLowerCase() || "").includes(q) ||
            (row.qpCode?.toLowerCase() || "").includes(q) ||
            (row.subject?.toLowerCase() || "").includes(q)
        );
    }, [boeList, search]);

    const handleManageClick = (row) => {
        setSelectedBoe(row);
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
                        placeholder="SEARCH BOE"
                        className="flex-1 outline-none font-lexend text-[0.9em] px-2.5"
                    />
                    <span className="w-px h-5 bg-gray-500 mr-2" />
                    <FiSearch className="text-gray-500 cursor-pointer" size={18} />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-48 flex justify-center items-center gap-3 bg-blue-200 text-blue-950 border border-blue-400 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300"
                >
                    <IoAdd size={18} /> ADD BOE
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                            <th className="border border-gray-400 p-2.5 w-20">Sl No</th>
                            <th className="border border-gray-400 p-2.5">BOE ID</th>
                            <th className="border border-gray-400 p-2.5">Name</th>
                            <th className="border border-gray-400 p-2.5 w-28">QP-Code</th>
                            <th className="border border-gray-400 p-2.5">Subject</th>
                            <th className="border border-gray-400 p-2.5 w-28">Course</th>
                            <th className="border border-gray-400 p-2.5 w-28">Semester</th>
                            <th className="border border-gray-400 p-2.5 w-28">Booklets</th>
                            <th className="border border-gray-400 p-2.5 w-40">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, index) => (
                            <tr key={row.boeId ?? index} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                <td className="border border-gray-400 p-2">{row.slNo ?? index + 1}</td>
                                <td className="border border-gray-400 p-2 text-[1.1em] font-mono font-medium tracking-wide text-left px-4">{row.boeId}</td>
                                <td className="border border-gray-400 p-2 text-left px-4">{row.name}</td>
                                <td className="border border-gray-400 p-2 font-mono">{row.qpCode}</td>
                                <td className="border border-gray-400 p-2 text-left px-4">{row.subject}</td>
                                <td className="border border-gray-400 p-2">{row.course}</td>
                                <td className="border border-gray-400 p-2">{row.semester}</td>
                                <td className="border border-gray-400 p-2">{row.booklets}</td>
                                <td className="border border-gray-400 p-1.5">
                                    <button
                                        onClick={() => handleManageClick(row)}
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
                                    No matching BOE records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Standard Add BOE Modal */}
            <AddBoeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                qpCodes={qpCodes}
                onAdd={(data) => {
                    onAddBoe?.(data);
                    setIsModalOpen(false);
                }}
            />

            {/* Newly Isolated Manage BOE Modal Component */}
            <PreviewBOEModal
                isOpen={isManageOpen}
                onClose={() => setIsManageOpen(false)}
                selectedBoe={selectedBoe}
            />
        </div>
    );
}