import React, { useRef, useEffect } from "react";
import TextAnnotationBox from "./TextAnnotationBox";

export default function PdfPageCanvas({
    page,
    renderZoom,
    visualZoom,
    annotations,
    currentTool,
    onCanvasClick,
    onCanvasRightClick,
    onHighlightDraw,
    activeTextKey, // e.g. "pageIndex-annotationIndex" or just annotationIndex if page is single
    onTextUpdate,
    onTextDeselect,
    onTextSelect,
}) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);

    const renderScale = renderZoom / 100;
    const visualScale = visualZoom / 100;

    // 1. Render PDF page to canvas
    useEffect(() => {
        if (!page || !canvasRef.current) return;
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        page.render({ canvasContext: ctx, viewport }).promise.catch(() => {});
    }, [page, renderScale]);

    // 2. Draw overlay annotations (except text annotations which are DOM-rendered)
    useEffect(() => {
        if (!overlayRef.current || !page) return;
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = overlayRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        annotations.forEach((ann) => {
            const cx = ann.x * renderScale;
            const cy = ann.y * renderScale;

            if (ann.type === "check") {
                ctx.strokeStyle = "#28a050";
                ctx.lineWidth = 3 * renderScale;
                const sz = 14 * renderScale;
                ctx.beginPath();
                ctx.moveTo(cx - sz / 2, cy);
                ctx.lineTo(cx, cy + sz / 2);
                ctx.lineTo(cx + sz, cy - sz / 2);
                ctx.stroke();
            } else if (ann.type === "cross") {
                ctx.strokeStyle = "#e03030";
                ctx.lineWidth = 3 * renderScale;
                const sz = 6 * renderScale; // Reduced size (sz = 6)
                ctx.beginPath();
                ctx.moveTo(cx - sz, cy - sz);
                ctx.lineTo(cx + sz, cy + sz);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + sz, cy - sz);
                ctx.lineTo(cx - sz, cy + sz);
                ctx.stroke();
            } else if (ann.type === "blank") {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate((-12 * Math.PI) / 180);
                const bw = 180 * renderScale;
                const bh = 50 * renderScale;
                ctx.strokeStyle = "#cc0000";
                ctx.lineWidth = 3.5 * renderScale;
                ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
                ctx.fillStyle = "rgba(255,255,255,0.92)";
                ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
                ctx.fillStyle = "#cc0000";
                ctx.font = `900 ${20 * renderScale}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("BLANK PAGE", 0, 0);
                ctx.restore();
            } else if (ann.type === "highlight") {
                // Highlighter is now rendered as a straight red horizontal line
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(ann.x2 * renderScale, cy);
                ctx.strokeStyle = "#e03030";
                ctx.lineWidth = 2.5 * renderScale;
                ctx.stroke();
                ctx.restore();
            } else if (ann.type === "mark") {
                // Mark entry badge [obt/max]
                ctx.save();
                const max = ann.max;
                const obt = ann.obt;
                const text = `[Q${ann.qno}: ${obt}/${max}]`;
                const isFull = parseFloat(obt) >= parseFloat(max);
                ctx.fillStyle = isFull ? "#28a050" : "#e03030";
                ctx.font = `bold ${13 * renderScale}px sans-serif`;
                ctx.textBaseline = "middle";
                ctx.fillText(text, cx, cy);
                ctx.restore();
            }
        });
    }, [annotations, page, renderScale]);

    const dragStartRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left click

        const rect = e.currentTarget.getBoundingClientRect();
        // Mouse moves in visual scale coordinates
        const cx = (e.clientX - rect.left) / visualScale;
        const cy = (e.clientY - rect.top) / visualScale;

        if (currentTool === "HL") {
            // Start straight red line drag
            dragStartRef.current = { x: cx, y: cy };
        } else if (currentTool === "TXT") {
            // Find if clicked inside any existing text box to edit
            const matchedIndex = annotations.findIndex((ann) => {
                if (ann.type !== "text") return false;
                const padding = 8;
                return (
                    cx >= ann.x - padding &&
                    cx <= ann.x + ann.width + padding &&
                    cy >= ann.y - padding &&
                    cy <= ann.y + ann.height + padding
                );
            });

            if (matchedIndex !== -1) {
                e.stopPropagation();
                onTextSelect(matchedIndex);
            }
        }
    };

    const handleMouseUp = (e) => {
        if (!dragStartRef.current || currentTool !== "HL") return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / visualScale;
        const start = dragStartRef.current;
        dragStartRef.current = null;

        if (Math.abs(cx - start.x) > 5) {
            onHighlightDraw && onHighlightDraw({ x: start.x, y: start.y, x2: cx });
        }
    };

    const handleCanvasClickWithCoords = (e) => {
        // Prevent click events if drawing highlight
        if (currentTool === "HL") return;

        // If clicked directly on the input/textarea of the active text box, do nothing
        if (e.target !== overlayRef.current) return;

        onCanvasClick(e);
    };

    // Calculate dimensions for the relative container
    const width = page ? page.getViewport({ scale: renderScale }).width : 0;
    const height = page ? page.getViewport({ scale: renderScale }).height : 0;

    // Display dimensions match the actual visual zoom level to keep page flow correct
    const displayWidth = page ? page.getViewport({ scale: visualScale }).width : 0;
    const displayHeight = page ? page.getViewport({ scale: visualScale }).height : 0;

    return (
        <div
            className="relative shadow-xl rounded flex-shrink-0 bg-white"
            style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                overflow: "visible",
            }}
        >
            <div
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `scale(${visualZoom / renderZoom})`,
                    transformOrigin: "top left",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                <canvas ref={canvasRef} className="block" />
                <canvas
                    ref={overlayRef}
                    className={`absolute inset-0 z-10 ${
                        currentTool === "SELECT"
                            ? "cursor-default"
                            : currentTool === "TXT"
                            ? "cursor-text"
                            : currentTool === "DEL"
                            ? "cursor-alias"
                            : "cursor-crosshair"
                    }`}
                    onClick={handleCanvasClickWithCoords}
                    onContextMenu={onCanvasRightClick}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                />

                {/* DOM-rendered Text Annotations */}
                {annotations.map((ann, idx) => {
                    if (ann.type !== "text") return null;
                    const isActive = activeTextKey === idx;
                    return (
                        <TextAnnotationBox
                            key={idx}
                            ann={ann}
                            renderScale={renderScale}
                            visualZoom={visualZoom}
                            isActive={isActive}
                            onUpdate={(updated) => onTextUpdate(idx, updated)}
                            onDeselect={onTextDeselect}
                        />
                    );
                })}
            </div>
        </div>
    );
}
