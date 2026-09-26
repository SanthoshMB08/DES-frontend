import React, { useMemo, useState } from "react";
import { IoAdd } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";

const roleLabel = (name) => name.replace(/^ROLE_/, "");

export default function AdminUsersTable({
    users = [],
    loading,
    loadError,
    onAddUser,
    onResetPassword,
    onUnlock,
    onDelete,
}) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            (u.username?.toLowerCase() || "").includes(q) ||
            (u.fullName?.toLowerCase() || "").includes(q) ||
            (u.roles || []).some(r => roleLabel(r).toLowerCase().includes(q))
        );
    }, [users, search]);

    return (
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="w-full flex items-center justify-between gap-6">
                <div className="w-1/2 flex items-center border border-gray-500 rounded-[0.3em] px-3 py-2.5 gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="SEARCH USERS (ID / NAME / ROLE)"
                        className="flex-1 outline-none font-lexend text-[0.9em] px-2.5"
                    />
                    <span className="w-px h-5 bg-gray-500 mr-2" />
                    <FiSearch className="text-gray-500 cursor-pointer" size={18} />
                </div>
                <button
                    onClick={onAddUser}
                    className="w-56 flex justify-center items-center gap-3 bg-blue-200 text-blue-950 border border-blue-400 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-300"
                >
                    <IoAdd size={18} /> CREATE USER
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                            <th className="border border-gray-400 p-2.5 w-20">Sl No</th>
                            <th className="border border-gray-400 p-2.5">Username</th>
                            <th className="border border-gray-400 p-2.5">Full Name</th>
                            <th className="border border-gray-400 p-2.5 w-32">Role</th>
                            <th className="border border-gray-400 p-2.5 w-28">Status</th>
                            <th className="border border-gray-400 p-2.5 w-72">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={6} className="border border-gray-400 p-3 text-center font-lexend text-sm text-gray-500">Loading...</td></tr>
                        )}
                        {!loading && loadError && (
                            <tr><td colSpan={6} className="border border-gray-400 p-3 text-center font-lexend text-sm text-red-600">{loadError}</td></tr>
                        )}
                        {!loading && !loadError && filtered.length === 0 && (
                            <tr><td colSpan={6} className="border border-gray-400 p-4 text-center font-lexend text-[0.9em] text-gray-500">No matching users found</td></tr>
                        )}
                        {!loading && !loadError && filtered.map((u, index) => (
                            <tr key={u.id} className="text-[0.9em] font-lexend font-medium text-center h-10 hover:bg-blue-50">
                                <td className="border border-gray-400 p-2">{index + 1}</td>
                                <td className="border border-gray-400 p-2 font-mono text-left px-4">{u.username}</td>
                                <td className="border border-gray-400 p-2 text-left px-4">{u.fullName}</td>
                                <td className="border border-gray-400 p-2">
                                    {(u.roles || []).map(roleLabel).join(", ")}
                                </td>
                                <td className="border border-gray-400 p-2">
                                    <span className={`inline-block px-3 py-1 rounded-[0.3em] text-[10px] font-bold border ${
                                        u.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-400" :
                                        u.status === "LOCKED" ? "bg-red-100 text-red-700 border-red-400" :
                                        "bg-gray-200 text-gray-600 border-gray-400"}`}>
                                        {u.status}{u.lockedAt ? " / LOCKED" : ""}
                                    </span>
                                </td>
                                <td className="border border-gray-400 p-1.5">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onResetPassword(u)}
                                            className="border border-indigo-400 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-1.5 px-2 rounded-[0.3em] text-[10px] tracking-wider cursor-pointer">
                                            RESET PWD
                                        </button>
                                        <button
                                            onClick={() => onUnlock(u)}
                                            className="border border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-medium py-1.5 px-2 rounded-[0.3em] text-[10px] tracking-wider cursor-pointer">
                                            UNLOCK
                                        </button>
                                        <button
                                            onClick={() => onDelete(u)}
                                            className="border border-red-400 bg-red-100 text-red-700 hover:bg-red-200 font-medium py-1.5 px-2 rounded-[0.3em] text-[10px] tracking-wider cursor-pointer">
                                            DELETE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
