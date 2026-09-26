import React from "react";
import { Minus, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function FooterBar({
    pagesCount,
    visualZoom,
    onZoomIn,
    onZoomOut,
    onReject,
    onSubmit,
    isExporting,
    submitLabel = "SUBMIT PACKET",
}) {
    return (
        <div className="bg-white border-t border-[#d0d4dc] p-2 px-4 flex items-center justify-between shrink-0 shadow-md">
            {/* Pages count */}
            <div className="font-bold text-gray-500 text-xs">
                PAGES :{" "}
                <span className="text-gray-900 font-mono">{pagesCount || "—"}</span>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
                <button
                    id="zoom-out"
                    onClick={onZoomOut}
                    className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"
                    title="Zoom out"
                >
                    <Minus size={11} />
                </button>
                <span className="min-w-[46px] text-center font-mono text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 font-bold">
                    {visualZoom}%
                </span>
                <button
                    id="zoom-in"
                    onClick={onZoomIn}
                    className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"
                    title="Zoom in"
                >
                    <Plus size={11} />
                </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <button
                    id="btn-reject"
                    onClick={onReject}
                    className="bg-gray-100 border border-gray-300 text-gray-600 rounded-md px-4 py-1.5 text-xs font-bold hover:bg-gray-200 cursor-pointer transition-colors flex items-center gap-1"
                >
                    <AlertTriangle size={12} />
                    REJECT
                </button>
                <button
                    id="btn-submit"
                    onClick={onSubmit}
                    disabled={isExporting}
                    className={`rounded-md px-5 py-1.5 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 ${
                        isExporting
                            ? "bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed"
                            : "bg-[#48c870] border border-[#28a050] text-white hover:bg-[#30b058] cursor-pointer"
                    }`}
                >
                    {isExporting ? (
                        <>
                            <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            EXPORTING…
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={13} />
                            {submitLabel}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
