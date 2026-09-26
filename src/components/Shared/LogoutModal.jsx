import React from "react";

import { PiWarningOctagon } from "react-icons/pi";

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="w-full max-w-md bg-white border border-red-300 rounded-[0.3em] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">

                {/* HEADER (Red Warning) */}
                <div className="flex justify-between items-center bg-red-300 border-b border-red-200 px-6 py-4 rounded-t-[0.3em]">
                    <h3 className="font-lexend font-bold text-[0.95em] uppercase tracking-wide text-red-800 flex items-center gap-2">
                        <PiWarningOctagon size={20} className="text-red-800" />
                        WARNING !
                    </h3>
                </div>

                {/* BODY */}
                <div className="p-8 flex flex-col gap-6 text-center">
                    <p className="font-lexend text-[1.05em] font-medium text-gray-700">
                        Are You Sure You Want to Logout ?
                    </p>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex border-t border-gray-100 p-4 justify-end gap-4 rounded-b-[0.3em]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-blue-100 border border-blue-400 text-blue-700 px-8 py-2 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-blue-200 transition-colors"
                    >
                        NO
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="bg-red-200 border border-red-500 text-red-950 px-12 py-2 rounded-[0.3em] font-lexend font-medium text-sm tracking-wide cursor-pointer hover:bg-red-300 transition-colors"
                    >
                        YES
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;