import React, { useEffect, useRef, useCallback } from "react";

const COLORS = [
    { hex: "#e03030", label: "Red" },
    { hex: "#28a050", label: "Green" },
];

/**
 * TextAnnotationBox
 * Renders a DOM overlay on the PDF canvas.
 * - View mode (isActive=false): pointer-events:none, just shows text
 * - Edit mode (isActive=true): full textbox with drag/resize/color controls
 *
 * Coordinate system:
 *   ann.x/y/width/height are in BASE PDF coordinates (at zoom=100).
 *   renderScale = renderZoom / 100  → used to position/size DOM elements (canvas is rendered at renderZoom).
 *   visualZoom  = current visual zoom % → used for mouse delta math (mouse moves in visual pixels).
 */
export default function TextAnnotationBox({
    ann,
    renderScale,
    visualZoom,
    isActive,
    onUpdate,
    onDeselect,
}) {
    const boxRef = useRef(null);
    // Full visual scale factor (CSS transform on parent + canvas render scale)
    const effectiveScale = visualZoom / 100;

    // Click-outside to deselect
    useEffect(() => {
        if (!isActive) return;
        const handler = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                onDeselect();
            }
        };
        // Delay to avoid immediate dismiss on the same click that activated it
        const timer = setTimeout(() => document.addEventListener("mousedown", handler), 120);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handler);
        };
    }, [isActive, onDeselect]);

    // ── Drag to move ─────────────────────────────────────────────────────────
    const handleDragMouseDown = useCallback((e) => {
        if (!isActive) return;
        e.preventDefault();
        e.stopPropagation();
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const origX = ann.x;
        const origY = ann.y;

        const onMove = (me) => {
            const dx = (me.clientX - startMouseX) / effectiveScale;
            const dy = (me.clientY - startMouseY) / effectiveScale;
            onUpdate({ ...ann, x: origX + dx, y: origY + dy });
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [ann, effectiveScale, isActive, onUpdate]);

    // ── Drag to resize (bottom-right corner handle) ───────────────────────────
    const handleResizeMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const origW = ann.width;
        const origH = ann.height;

        const onMove = (me) => {
            const dx = (me.clientX - startMouseX) / effectiveScale;
            const dy = (me.clientY - startMouseY) / effectiveScale;
            onUpdate({
                ...ann,
                width: Math.max(80, origW + dx),
                height: Math.max(36, origH + dy),
            });
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [ann, effectiveScale, onUpdate]);

    // Visual dimensions (positioned within the renderZoom-scaled canvas)
    const visLeft   = ann.x      * renderScale;
    const visTop    = ann.y      * renderScale;
    const visWidth  = ann.width  * renderScale;
    const visHeight = ann.height * renderScale;
    const visFontSz = ann.fontSize * renderScale;

    // ── VIEW MODE ─────────────────────────────────────────────────────────────
    if (!isActive) {
        return (
            <div
                style={{
                    position:      "absolute",
                    left:          visLeft,
                    top:           visTop,
                    width:         visWidth,
                    minHeight:     visHeight,
                    fontFamily:    "'Caveat', cursive",
                    fontSize:      visFontSz,
                    fontWeight:    400,
                    lineHeight:    1.35,
                    color:         ann.color || "#e03030",
                    padding:       "2px 5px",
                    pointerEvents: "none",
                    userSelect:    "none",
                    whiteSpace:    "pre-wrap",
                    wordBreak:     "break-word",
                    overflow:      "hidden",
                }}
            >
                {ann.text}
            </div>
        );
    }

    // ── EDIT MODE ─────────────────────────────────────────────────────────────
    const DRAG_BAR_H = 18;

    return (
        <div
            ref={boxRef}
            style={{
                position:      "absolute",
                left:          visLeft,
                top:           visTop,
                width:         visWidth,
                height:        visHeight,
                zIndex:        200,
                pointerEvents: "auto",
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* ── Color switch pill (floats above the box) ────────────── */}
            <div
                style={{
                    position:     "absolute",
                    top:          -(DRAG_BAR_H + 10),
                    left:         0,
                    display:      "flex",
                    alignItems:   "center",
                    gap:          5,
                    background:   "white",
                    border:       "1px solid #d0d8ee",
                    borderRadius: 10,
                    padding:      "3px 8px",
                    boxShadow:    "0 2px 8px rgba(0,0,0,0.14)",
                    userSelect:   "none",
                }}
            >
                <span style={{ fontSize: 9, color: "#888", marginRight: 2, fontWeight: 600, letterSpacing: "0.03em" }}>
                    Color:
                </span>
                {COLORS.map((c) => (
                    <button
                        key={c.hex}
                        title={c.label}
                        onClick={(e) => { e.stopPropagation(); onUpdate({ ...ann, color: c.hex }); }}
                        style={{
                            width:        15,
                            height:       15,
                            borderRadius: "50%",
                            background:   c.hex,
                            border:       ann.color === c.hex
                                ? "2.5px solid #222"
                                : "1.5px solid rgba(0,0,0,0.15)",
                            cursor:       "pointer",
                            outline:      "none",
                            flexShrink:   0,
                            transition:   "transform 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                ))}
            </div>

            {/* ── Drag handle bar (top) ───────────────────────────────── */}
            <div
                onMouseDown={handleDragMouseDown}
                style={{
                    height:           DRAG_BAR_H,
                    background:       "rgba(68,136,255,0.18)",
                    borderRadius:     "4px 4px 0 0",
                    borderTop:        "1.5px dashed #4488ff",
                    borderLeft:       "1.5px dashed #4488ff",
                    borderRight:      "1.5px dashed #4488ff",
                    cursor:           "grab",
                    display:          "flex",
                    alignItems:       "center",
                    justifyContent:   "center",
                    userSelect:       "none",
                }}
            >
                {/* Grip dots */}
                <svg width="28" height="6" viewBox="0 0 28 6">
                    {[2, 8, 14, 20, 26].map((cx) => (
                        <React.Fragment key={cx}>
                            <circle cx={cx} cy={1.5} r={1.2} fill="#4488ff" opacity={0.7} />
                            <circle cx={cx} cy={4.5} r={1.2} fill="#4488ff" opacity={0.7} />
                        </React.Fragment>
                    ))}
                </svg>
            </div>

            {/* ── Textarea ────────────────────────────────────────────── */}
            <textarea
                autoFocus
                value={ann.text}
                onChange={(e) => onUpdate({ ...ann, text: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === "Escape") { e.preventDefault(); onDeselect(); }
                    // Allow Tab/Enter inside textarea naturally
                    e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    display:     "block",
                    width:       "100%",
                    height:      `calc(100% - ${DRAG_BAR_H}px)`,
                    fontFamily:  "'Caveat', cursive",
                    fontSize:    visFontSz,
                    fontWeight:  400,
                    lineHeight:  1.35,
                    color:       ann.color || "#e03030",
                    background:  "rgba(255,255,255,0.92)",
                    border:      "1.5px dashed #4488ff",
                    borderTop:   "none",
                    borderRadius: "0 0 4px 4px",
                    padding:     "4px 6px",
                    outline:     "none",
                    resize:      "none",
                    boxSizing:   "border-box",
                }}
            />

            {/* ── Resize handle (bottom-right corner) ─────────────────── */}
            <div
                onMouseDown={handleResizeMouseDown}
                title="Drag to resize"
                style={{
                    position:     "absolute",
                    bottom:       0,
                    right:        0,
                    width:        16,
                    height:       16,
                    background:   "#4488ff",
                    borderRadius: "3px 0 4px 0",
                    cursor:       "nwse-resize",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    zIndex:       201,
                }}
            >
                {/* Resize arrow icon */}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1 8L8 1M5 8L8 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
}
