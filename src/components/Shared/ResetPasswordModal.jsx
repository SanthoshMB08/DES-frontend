import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { MdPassword } from "react-icons/md";

const ResetPasswordModal = ({ isOpen, onClose, onConfirm, error }) => {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        matchPassword: ""
    });

    // Toggle password visibility states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showMatch, setShowMatch] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation check for matching passwords
        if (formData.newPassword !== formData.matchPassword) {
            alert("New passwords do not match!");
            return;
        }
        onConfirm(formData);
        setFormData({ currentPassword: "", newPassword: "", matchPassword: "" });
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="w-full max-w-md bg-white border border-blue-300 rounded-[0.3em] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">

                {/* HEADER (Blue Security Style) */}
                <div className="flex justify-between items-center bg-blue-100 border-b border-blue-200 px-6 py-4 rounded-t-[0.3em]">
                    <h3 className="font-lexend font-bold text-[0.95em] uppercase tracking-wide text-blue-800 flex items-center gap-2">
                        <MdPassword size={18} className="text-blue-700" />
                        UPDATE PASSWORD
                    </h3>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

                    {/* CURRENT PASSWORD */}
                    <div className="flex flex-col gap-1">
                        <label className="font-lexend text-[0.8em] font-bold text-gray-600 uppercase tracking-wide">
                            Current Password
                        </label>
                        <div className="relative w-full">
                            <input
                                type={showCurrent ? "text" : "password"}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-400 rounded-[0.3em] font-lexend text-sm outline-none focus:border-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                            >
                                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* NEW PASSWORD */}
                    <div className="flex flex-col gap-1">
                        <label className="font-lexend text-[0.8em] font-bold text-gray-600 uppercase tracking-wide">
                            New Password
                        </label>
                        <div className="relative w-full">
                            <input
                                type={showNew ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-400 rounded-[0.3em] font-lexend text-sm outline-none focus:border-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                            >
                                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* MATCH PASSWORD */}
                    <div className="flex flex-col gap-1">
                        <label className="font-lexend text-[0.8em] font-bold text-gray-600 uppercase tracking-wide">
                            confirm password
                        </label>
                        <div className="relative w-full">
                            <input
                                type={showMatch ? "text" : "password"}
                                name="matchPassword"
                                value={formData.matchPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-400 rounded-[0.3em] font-lexend text-sm outline-none focus:border-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowMatch(!showMatch)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                            >
                                {showMatch ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    {error && (
                        <p className="font-lexend text-[0.8em] text-red-600 -mt-1">{error}</p>
                    )}
                    <div className="flex  p-4 mt-2 justify-end gap-4 mx-[-1.5rem] mb-[-1rem] rounded-b-[0.3em]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-100 border border-gray-400 text-gray-700 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-[0.8em] tracking-wide cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-200 border border-blue-400 text-blue-950 px-5 py-2.5 rounded-[0.3em] font-lexend font-medium text-[0.8em] tracking-wide cursor-pointer hover:bg-blue-300 transition-colors"
                        >
                            UPDATE PASSWORD
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordModal;