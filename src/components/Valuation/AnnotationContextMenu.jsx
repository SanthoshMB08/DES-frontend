import React, { useRef, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

const COLORS = [
    { hex: "#e03030", label: "Incorrect / Remark (Red)" },
    { hex: "#28a050", label: "Correct / Allocation (Green)" },
];

export default function AnnotationContextMenu({ x, y, color, size, onColorChange, onSizeChange, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl p-3 min-w-[180px]"
            style={{ left: x, top: y }}
        >
            <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Color Preset</div>
            <div className="flex gap-3 mb-3">
                {COLORS.map((c) => (
                    <button
                        key={c.hex}
                        title={c.label}
                        onClick={() => onColorChange(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded border transition-transform hover:scale-105 cursor-pointer ${
                            color === c.hex
                                ? "border-black ring-2 ring-offset-1 ring-white"
                                : "border-gray-200"
                        }`}
                    />
                ))}
            </div>
            <div className="h-[1px] bg-gray-100 mb-2" />
            <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Font Scale</div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onSizeChange(Math.max(10, size - 2))}
                    className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                >
                    <Minus size={10} />
                </button>
                <span className="font-mono font-bold text-xs w-8 text-center">{size}px</span>
                <button
                    onClick={() => onSizeChange(Math.min(40, size + 2))}
                    className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                >
                    <Plus size={10} />
                </button>
            </div>
        </div>
    );
}
