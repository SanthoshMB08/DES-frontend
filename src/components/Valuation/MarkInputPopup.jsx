import React, { useState, useRef, useEffect } from "react";

export default function MarkInputPopup({ question, clientX, clientY, onConfirm, onCancel }) {
    const [value, setValue] = useState("");
    const inputRef = useRef(null);
    const markOptions = [];
    for (let mark = 0; mark <= Number(question.max); mark += 0.5) {
        markOptions.push(Number(mark.toFixed(2)));
    }
    if (markOptions.at(-1) !== Number(question.max)) {
        markOptions.push(Number(question.max));
    }

    useEffect(() => {
        // Small delay to let the popup mount before focusing
        const t = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onCancel]);

    const handleConfirm = () => {
        const v = value.trim();
        if (!v) { onCancel(); return; }
        onConfirm(v);
    };

    // Clamp popup position so it stays inside viewport
    const popupW = 220;
    const popupH = 110;
    const left = Math.min(Math.max(clientX, 8), window.innerWidth - popupW - 8);
    const top = Math.min(Math.max(clientY + 8, 8), window.innerHeight - popupH - 8);

    return (
        <>
            {/* Backdrop - click anywhere to cancel */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={onCancel}
            />

            {/* Popup card */}
            <div
                id="mark-input-popup"
                className="fixed z-[9999] rounded-xl shadow-2xl overflow-hidden"
                style={{ left, top, width: popupW }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-3 py-2 flex items-center justify-between">
                    <div>
                        <span className="font-black text-sm">Q{question.qno}</span>
                        <span className="text-blue-200 text-[10px] ml-1.5">Enter Marks</span>
                    </div>
                    <span className="text-[10px] bg-blue-800/60 px-2 py-0.5 rounded-full font-bold">
                        Max: {question.max}
                    </span>
                </div>

                {/* Input row */}
                <div className="bg-white p-3 flex items-center gap-2">
                    <select
                        ref={inputRef}
                        id="mark-value-input"
                        aria-label={`Marks for question ${question.qno}`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirm();
                            if (e.key === "Escape") onCancel();
                            e.stopPropagation();
                        }}
                        className="w-[86px] text-center text-lg font-black bg-gray-50 border-2 border-blue-300 rounded-lg p-1 outline-none focus:border-blue-600 transition-colors font-mono"
                    >
                        <option value="">Marks</option>
                        {markOptions.map((mark) => <option key={mark} value={mark}>{mark}</option>)}
                    </select>
                    <span className="text-gray-400 font-bold text-sm">/ {question.max}</span>
                    <div className="flex gap-1.5 ml-auto">
                        <button
                            onClick={handleConfirm}
                            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                            ✓ MARK
                        </button>
                        <button
                            onClick={onCancel}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
