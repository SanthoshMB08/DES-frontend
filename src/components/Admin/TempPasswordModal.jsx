import React from "react";

export default function TempPasswordModal({ isOpen, onClose, username, tempPassword }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-96 bg-white rounded-[0.3em] overflow-hidden border border-gray-300">
                <div className="w-full bg-indigo-600 px-6 py-4">
                    <span className="font-lexend font-bold text-white text-[1em] tracking-wider uppercase">Password Reset</span>
                </div>
                <div className="p-6 flex flex-col gap-3">
                    <p className="font-lexend text-sm text-gray-700">
                        A temporary password has been generated for <span className="font-bold">{username}</span>.
                        Share it with them - they'll be asked to change it on next login.
                    </p>
                    <div className="border border-gray-400 rounded-[0.3em] px-3 py-2.5 font-mono text-lg text-center tracking-widest bg-gray-50">
                        {tempPassword}
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-2 bg-blue-600 text-white font-lexend font-medium text-sm tracking-wide py-2.5 rounded-[0.3em] cursor-pointer hover:bg-blue-700">
                        DONE
                    </button>
                </div>
            </div>
        </div>
    );
}
