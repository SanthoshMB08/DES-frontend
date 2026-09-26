import React, { useRef } from "react";

export default function PdfUploadBar({ onLoad, fileName }) {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        const objectUrl = URL.createObjectURL(file);
        onLoad(objectUrl, file.name);
        // Reset so same file can be re-uploaded
        e.target.value = "";
    };

    return (
        <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
            >
                UPLOAD PDF
            </button>
            <div className="flex-1 bg-[#f0f4ff] border border-[#b8c8f0] rounded-lg px-3 py-2 text-xs truncate">
                {fileName
                    ? <span className="text-gray-700 font-semibold">{fileName}</span>
                    : <span className="text-gray-400">Select standard evaluate document format</span>
                }
            </div>
        </div>
    );
}
