import React, { useState, useEffect, useRef } from "react";

import { IoAdd, IoRemove, IoRefreshOutline } from "react-icons/io5";
import { IoCloseCircleOutline } from "react-icons/io5";


export default function PDFPreviewModal({ isOpen, onClose, fileUrl, fileName }) {
    // Zoom strictly initialized to 70% as the base scale
    const [zoom, setZoom] = useState(70);

    // Position state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const modalRef = useRef(null);

    // Center the modal perfectly on screen on load
    useEffect(() => {
        if (isOpen) {
            setZoom(110); // Force default 70% layout width on open
            const modalWidth = window.innerWidth * 0.60; // 60% Width

            const centerX = (window.innerWidth - modalWidth) / 2;
            const centerY = 10; // 10px offset down from top to match bottom spacing

            setPosition({ x: centerX, y: centerY });
        }
    }, [isOpen]);

    if (!isOpen || !fileUrl) return null;

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 150));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 50));
    const handleResetZoom = () => setZoom(70);

    // Draggable Bound Constrained Logic
    const handleMouseDown = (e) => {
        if (e.target.closest("button") || e.target.closest(".zoom-controls")) return;

        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;

        const modalWidth = window.innerWidth * 0.60;

        // Calculate theoretical next positions
        let nextX = e.clientX - dragStart.current.x;
        let nextY = e.clientY - dragStart.current.y;

        // Boundary Guardrails: Restrict bounding coordinates inside active viewport
        nextX = Math.max(0, Math.min(nextX, window.innerWidth - modalWidth));
        nextY = Math.max(0, Math.min(nextY, window.innerHeight - 50));

        setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    return (
        <div
            ref={modalRef}
            // Changed height to h-[calc(100vh-20px)] and removed rounded corners completely
            className="fixed z-[60] w-[60%] h-[calc(100vh-20px)] bg-white shadow-2xl flex flex-col overflow-hidden rounded-[0.2em] rounded-b-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Modal Header Bar */}
            <div
                onMouseDown={handleMouseDown}
                className="p-4 bg-blue-600 flex justify-between items-center shrink-0 cursor-move select-none"
            >
                <h4 className="font-lexend font-medium text-sm text-white uppercase tracking-wider truncate max-w-[50%] pointer-events-none">
                    {fileName || "Document"}
                </h4>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1" aria-label="Document zoom controls">
                        <button type="button" onClick={handleZoomOut} className="p-1 text-white" aria-label="Zoom out"><IoRemove /></button>
                        <button type="button" onClick={handleResetZoom} className="px-1 text-xs text-white" aria-label="Reset zoom">{zoom}%</button>
                        <button type="button" onClick={handleZoomIn} className="p-1 text-white" aria-label="Zoom in"><IoAdd /></button>
                    </div>
                    {/* CLOSE BTN */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="mr-1 px-4 py-1 bg-red-500 text-white text-[0.85em] rounded-[0.2em] font-lexend font-medium cursor-pointer"
                    >
                        CLOSE
                    </button>
                </div>
            </div>

            {/* Document Workspace Panel */}
            <div className="flex-1 bg-gray-200/70 overflow-auto flex justify-center items-start
                [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400"
            >
                {/* Fixed width dynamically linked to active state scale percentages */}
                <div
                    className="h-full transition-all duration-150 origin-top flex justify-center"
                    style={{ width: `${zoom}%` }}
                >
                    <iframe
                        src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
                        title={fileName}
                        className="w-full h-full bg-white border-0 shadow-md rounded-none"
                        style={{ minHeight: "calc(100vh - 120px)" }}
                    />
                </div>
            </div>
        </div>
    );
}
