import React from "react";
import { Check, X, Type, Eraser, Clock, LogOut, Highlighter, MousePointer2 } from "lucide-react";

function formatTimer(t) {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

export default function Toolbar({
    bookletId,
    qpCode,
    currentTool,
    onToolChange,
    seconds,
    onExit,
    isExiting = false,
}) {
    return (
        <div className="bg-white border-b border-[#d0d4dc] flex items-center gap-2 p-2 shrink-0 shadow-sm z-10 flex-wrap">
            {/* Booklet/QP info */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="bg-gradient-to-r from-[#f0e8f8] to-[#e8d8f4] border border-[#c8aee0] rounded px-3 py-1 font-bold text-[#4a2a7a] tracking-wide whitespace-nowrap">
                    BOOKLET ID: <span className="font-mono text-sm ml-1 font-black">{bookletId}</span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded px-3 py-1 font-bold text-blue-900 tracking-wide whitespace-nowrap">
                    QP CODE: <span className="font-mono text-sm ml-1 font-black">{qpCode}</span>
                </div>
            </div>

            <div className="h-7 w-[1.5px] bg-[#e0e4ea] mx-1 shrink-0" />

            {/* Tool buttons */}
            <div className="flex items-center gap-1.5 px-1 flex-wrap">
                {/* Pointer */}
                <button
                    id="tool-pointer"
                    className={`w-9 h-9 border rounded-md transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                        currentTool === "SELECT"
                            ? "bg-gray-700 border-gray-900 text-white shadow-inner"
                            : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => onToolChange("SELECT")}
                    title="Pointer — select questions without placing a mark"
                    aria-label="Pointer tool"
                >
                    <MousePointer2 size={17} />
                </button>

                {/* Check (Right) */}
                <button
                    id="tool-check"
                    className={`w-9 h-9 border rounded-md transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                        currentTool === "R"
                            ? "bg-[#28a050] border-[#157030] text-white shadow-inner"
                            : "bg-[#e8f8ee] border-[#60b878] text-[#1a6e30] hover:bg-[#c8f0d8]"
                    }`}
                    onClick={() => onToolChange("R")}
                    title="Correct mark (✓)"
                >
                    <Check size={18} />
                </button>

                {/* Cross (Wrong) */}
                <button
                    id="tool-cross"
                    className={`w-9 h-9 border rounded-md transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                        currentTool === "W"
                            ? "bg-red-600 border-red-800 text-white shadow-inner"
                            : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    }`}
                    onClick={() => onToolChange("W")}
                    title="Wrong mark (✗)"
                >
                    <X size={18} />
                </button>

                {/* Line (was Highlighter) */}
                <button
                    id="tool-line"
                    className={`px-2.5 h-9 font-bold border rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        currentTool === "HL"
                            ? "bg-red-500 border-red-700 text-white shadow-inner"
                            : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    }`}
                    onClick={() => onToolChange("HL")}
                    title="Red line marker — click & drag"
                >
                    <Highlighter size={13} />
                    LINE
                </button>

                {/* Text */}
                <button
                    id="tool-text"
                    className={`px-2.5 h-9 font-bold border rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        currentTool === "TXT"
                            ? "bg-blue-600 border-blue-800 text-white shadow-inner"
                            : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                    }`}
                    onClick={() => onToolChange("TXT")}
                    title="Text annotation — click to place, click box to edit"
                >
                    <Type size={13} />
                    TXT
                </button>

                {/* Delete */}
                <button
                    id="tool-del"
                    className={`px-2.5 h-9 font-bold border rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        currentTool === "DEL"
                            ? "bg-amber-500 border-amber-700 text-white shadow-inner"
                            : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                    }`}
                    onClick={() => onToolChange("DEL")}
                    title="Erase annotation — click to delete"
                >
                    <Eraser size={13} />
                    DEL
                </button>

                {/* Blank stamp */}
                <button
                    id="tool-blank"
                    className={`px-2.5 h-9 font-black border transition-all flex items-center justify-center cursor-pointer rounded-md shrink-0 ${
                        currentTool === "BLANK"
                            ? "bg-red-700 text-white border-red-900"
                            : "bg-white border-gray-400 text-red-600 hover:bg-red-50"
                    }`}
                    onClick={() => onToolChange("BLANK")}
                    title="Stamp page as Blank"
                >
                    <span className="border-2 border-current px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded transform -rotate-2">
                        BLANK
                    </span>
                </button>
            </div>

            {/* Contextual hint */}
            {currentTool === "TXT" && (
                <div className="text-[10px] text-blue-600 font-medium px-2 italic shrink-0 hidden lg:block">
                    Click page → place box · drag top bar to move · drag ↘ corner to resize
                </div>
            )}
            {currentTool === "HL" && (
                <div className="text-[10px] text-red-600 font-medium px-2 italic shrink-0 hidden lg:block">
                    Click &amp; drag on PDF to draw a red line
                </div>
            )}

            <div className="flex-1" />

            {/* Timer */}
            <div className="bg-[#e8f2ff] border border-[#90b8ee] rounded-md px-3 py-1.5 font-extrabold text-[#1a4488] tracking-wider flex items-center gap-1.5 shrink-0">
                <Clock size={14} />
                <span className="font-mono">{formatTimer(seconds)}</span>
            </div>

            {/* Exit */}
            <button
                id="btn-exit"
                onClick={onExit}
                disabled={isExiting}
                className="bg-[#fff0f0] border border-[#e09090] text-[#c02020] rounded-md px-3 py-1.5 font-bold hover:bg-[#ffd0d0] transition-all cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-wait"
            >
                <LogOut size={13} className="inline-block mr-1" /> {isExiting ? "RETURNING PAPERS…" : "EXIT"}
            </button>
        </div>
    );
}
