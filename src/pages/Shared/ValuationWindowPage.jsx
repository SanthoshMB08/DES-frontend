import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Component imports
import Toolbar from "../../components/Valuation/Toolbar";
import ScoreSheet from "../../components/Valuation/ScoreSheet";
import FooterBar from "../../components/Valuation/FooterBar";
import PdfPageCanvas from "../../components/Valuation/PdfPageCanvas";
import MarkInputPopup from "../../components/Valuation/MarkInputPopup";
import AnnotationContextMenu from "../../components/Valuation/AnnotationContextMenu";

import {
    getValuatorScript, listValuatorBundleScripts, submitScriptMarks, getValuatorScriptFile, submitScriptFile,
    getReviewerScript, listReviewerBundleScripts, reviewScript, getReviewerScriptFile,
} from "../../api/valuation";

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DEFAULT_QUESTIONS = [
    { qno: "01", max: 2, obt: "NA" },
    { qno: "02", max: 5, obt: "NA" },
    { qno: "03", max: 5, obt: "NA" },
    { qno: "04", max: 8, obt: "NA" },
    { qno: "05", max: 10, obt: "NA" },
    { qno: "06", max: 10, obt: "NA" },
    { qno: "07", max: 5, obt: "NA" },
    { qno: "08", max: 5, obt: "NA" },
];

const createQuestionsForScript = (markingScheme, marksJson) => {
    let savedQuestions = [];
    try {
        const parsed = JSON.parse(marksJson || "[]");
        if (Array.isArray(parsed)) savedQuestions = parsed;
    } catch {
        // Keep the default score sheet when saved marks are malformed.
    }
    if (!Array.isArray(markingScheme) || markingScheme.length === 0) {
        return savedQuestions.length > 0 ? savedQuestions : DEFAULT_QUESTIONS;
    }
    const savedByNumber = new Map(savedQuestions.map((question) => [question.qno, question]));
    let number = 0;
    return markingScheme.flatMap((section) =>
        Array.from({ length: section.questionCount }, () => {
            number += 1;
            const qno = String(number).padStart(2, "0");
            const saved = savedByNumber.get(qno);
            return {
                qno,
                max: Number(section.marksPerQuestion),
                obt: saved?.obt ?? "NA",
                section: section.name,
            };
        })
    );
};

export default function ValuationWindowPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reviewMode = searchParams.get("mode") === "review";

    // Session state
    const [bookletId, setBookletId] = useState("VALBCA2026007");
    const [qpCode, setQpCode] = useState("BCA-ECD506");
    const [scriptId, setScriptId] = useState(searchParams.get("scriptId") || null);
    const [scriptLoadError, setScriptLoadError] = useState("");
    const [seconds, setSeconds] = useState(0);

    // Zoom state (2-level zoom for performance: viewZoom is instant CSS zoom, renderZoom updates after 400ms debounce)
    const [viewZoom, setViewZoom] = useState(100);
    const [renderZoom, setRenderZoom] = useState(100);

    // Active tool state
    const [currentTool, setCurrentTool] = useState("SELECT");
    const [strokeColor, setStrokeColor] = useState("#e03030"); // Defaults to Red
    const [strokeSize, setStrokeSize] = useState(18); // Default font size for new text boxes

    // PDF state
    const [pdfReady, setPdfReady] = useState(false);
    const [fileName, setFileName] = useState("");
    const [pages, setPages] = useState([]);
    const [pdfError, setPdfError] = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const pdfDataRef = React.useRef(null);

    // Annotations state: { [pageIndex]: [annotation, ...] }
    const [annotations, setAnnotations] = useState({});

    // Active text annotation key: { pageIndex, annotationIndex }
    const [activeTextKey, setActiveTextKey] = useState(null);

    // Mark popup state: { pageIndex, x, y, clientX, clientY }
    const [markPopup, setMarkPopup] = useState(null);

    // Context menu state: { x, y } for right-click setting default styles
    const [contextMenu, setContextMenu] = useState(null);

    // Score sheet questions state
    const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
    const [markingScheme, setMarkingScheme] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(DEFAULT_QUESTIONS[0]);
    const [isExporting, setIsExporting] = useState(false);

    // 1. Run Timer
    useEffect(() => {
        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // 1b. Load the answer script to valuate, either directly (?scriptId=) or
    // the first pending script in a bundle (?bundleId=), passed in from the
    // Valuator dashboard.
    useEffect(() => {
        const bundleId = searchParams.get("bundleId");
        const initialScriptId = searchParams.get("scriptId");

        const applyScript = (script) => {
            setScriptId(script.id);
            setBookletId(script.answerBookletId);
            setQpCode(script.qpCode || "");
            const scheme = script.markingScheme || [];
            setMarkingScheme(scheme);
            const loadedQuestions = createQuestionsForScript(scheme, script.marksJson);
            setQuestions(loadedQuestions);
            setSelectedQuestion(loadedQuestions.find((question) => question.obt === "NA") || null);
            // Auto-load the scanned PDF the scanner already uploaded - no manual upload needed.
            loadScriptFile(script.id, script.scannedFileName);
        };

        (async () => {
            try {
                if (initialScriptId) {
                    const script = await (reviewMode ? getReviewerScript(initialScriptId) : getValuatorScript(initialScriptId));
                    applyScript(script);
                } else if (bundleId) {
                    const scripts = await (reviewMode ? listReviewerBundleScripts(bundleId) : listValuatorBundleScripts(bundleId));
                    const nextScript = scripts.find((s) => s.status === (reviewMode ? "VALUATED" : "PENDING"));
                    if (nextScript) applyScript(nextScript);
                }
            } catch (err) {
                setScriptLoadError(err.message || "Failed to load the answer script.");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetches the stored PDF (scanned original, or a previously-annotated copy) and
    // passes its bytes directly to PDF.js.
    const loadScriptFile = useCallback(async (id, name) => {
        setLoadingPdf(true);
        setPdfError(null);
        try {
            const blob = await (reviewMode ? getReviewerScriptFile(id) : getValuatorScriptFile(id));
            const data = new Uint8Array(await blob.arrayBuffer());
            loadPdf(data, name || "");
        } catch (err) {
            setLoadingPdf(false);
            setPdfError(err.message || "Failed to load the scanned answer sheet.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviewMode]);

    // 2. Debounce viewZoom to renderZoom (re-render canvases after 400ms of inactivity)
    useEffect(() => {
        const handler = setTimeout(() => {
            setRenderZoom(viewZoom);
        }, 400);
        return () => clearTimeout(handler);
    }, [viewZoom]);

    // 3. Load PDF Document
    const loadPdf = useCallback((data, name = "") => {
        setLoadingPdf(true);
        setPdfError(null);
        setPdfReady(false);
        setPages([]);
        setAnnotations({});
        setMarkPopup(null);
        setActiveTextKey(null);
        pdfDataRef.current = data;
        setFileName(name);

        pdfjsLib
            .getDocument({ data: data.slice() })
            .promise.then(async (doc) => {
                const pageProxies = [];
                for (let i = 1; i <= doc.numPages; i++) {
                    pageProxies.push(await doc.getPage(i));
                }
                setPages(pageProxies);
                setPdfReady(true);
                setLoadingPdf(false);
            })
            .catch((err) => {
                setPdfReady(false);
                setPdfError(`Failed to load document structure: ${err?.message || "Error"}`);
                setLoadingPdf(false);
            });
    }, []);

    // Helper to toggle selected question from score sheet
    const handleQuestionSelect = (q) => {
        setSelectedQuestion(q);
    };

    // 4. Totals calculations
    const maxTotal = markingScheme.length > 0
        ? markingScheme.reduce((sum, section) => sum + Number(section.maxMarks), 0)
        : questions.reduce((s, q) => s + q.max, 0);
    const consideredQuestionNumbers = new Set();
    const sectionTotals = markingScheme.map((section) => {
        const sectionQuestions = questions
            .map((question, index) => ({ question, index }))
            .filter(({ question }) => question.section === section.name)
            .sort((first, second) => {
                const firstObtained = Number.parseFloat(first.question.obt);
                const secondObtained = Number.parseFloat(second.question.obt);
                const firstScore = Number.isFinite(firstObtained) ? firstObtained : 0;
                const secondScore = Number.isFinite(secondObtained) ? secondObtained : 0;
                return secondScore - firstScore || first.index - second.index;
            });
        const consideredCount = Math.min(
            sectionQuestions.length,
            Math.ceil(Number(section.maxMarks) / Number(section.marksPerQuestion))
        );
        const considered = sectionQuestions.slice(0, consideredCount);
        considered.forEach(({ question }) => consideredQuestionNumbers.add(question.qno));
        const total = considered.reduce((sum, { question }) => {
            const obtained = Number.parseFloat(question.obt);
            return sum + (Number.isFinite(obtained) ? obtained : 0);
        }, 0);
        return { name: section.name, total: Math.min(total, Number(section.maxMarks)) };
    });
    const obtainedTotal = markingScheme.length > 0
        ? sectionTotals.reduce((sum, section) => sum + section.total, 0)
        : questions.reduce(
            (sum, question) =>
                question.obt !== "NA" && question.obt !== "BLK"
                    ? sum + (Number.parseFloat(question.obt) || 0)
                    : sum,
            0
        );
    const standardHasMarks = questions.some((q) => q.obt !== "NA" && q.obt !== "BLK");

    // 5. Canvas Click handlers
    const handleCanvasClick = (e, pageIndex) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const scale = viewZoom / 100;
        const cx = (e.clientX - rect.left) / scale;
        const cy = (e.clientY - rect.top) / scale;

        // A. If question selected: trigger marking popup
        if (selectedQuestion) {
            setMarkPopup({
                pageIndex,
                x: cx,
                y: cy,
                clientX: e.clientX,
                clientY: e.clientY,
            });
            return;
        }

        // B. Text Tool placement
        if (currentTool === "TXT") {
            // Close active text first if any
            if (activeTextKey) {
                handleTextDeselect();
                return;
            }

            const newTextAnn = {
                type: "text",
                x: cx,
                y: cy - 10,
                width: 160,
                height: 48,
                text: "",
                color: strokeColor,
                fontSize: strokeSize,
            };

            setAnnotations((prev) => {
                const currentList = [...(prev[pageIndex] || [])];
                currentList.push(newTextAnn);
                const newIdx = currentList.length - 1;
                setActiveTextKey({ pageIndex, annotationIndex: newIdx });
                return { ...prev, [pageIndex]: currentList };
            });
            return;
        }

        // C. Delete Tool
        if (currentTool === "DEL") {
            setAnnotations((prev) => {
                const currentList = prev[pageIndex] || [];
                const filtered = currentList.filter((ann) => {
                    if (ann.type === "blank") {
                        const withinX = Math.abs(cx - ann.x) <= 90;
                        const withinY = Math.abs(cy - ann.y) <= 25;
                        return !(withinX && withinY);
                    }
                    if (ann.type === "highlight") {
                        const withinX = cx >= Math.min(ann.x, ann.x2) && cx <= Math.max(ann.x, ann.x2);
                        const withinY = Math.abs(cy - ann.y) <= 15;
                        return !(withinX && withinY);
                    }
                    if (ann.type === "mark") {
                        const distance = Math.sqrt(Math.pow(cx - ann.x, 2) + Math.pow(cy - ann.y, 2));
                        return distance > 25;
                    }
                    if (ann.type === "text") {
                        const padding = 8;
                        const isInside =
                            cx >= ann.x - padding &&
                            cx <= ann.x + ann.width + padding &&
                            cy >= ann.y - padding &&
                            cy <= ann.y + ann.height + padding;
                        return !isInside;
                    }
                    const distance = Math.sqrt(Math.pow(cx - ann.x, 2) + Math.pow(cy - ann.y, 2));
                    return distance > 20;
                });

                // Check if any deleted annotation was a "mark" type
                const deletedMark = currentList.find(
                    (ann) =>
                        ann.type === "mark" &&
                        !filtered.some((f) => f.type === "mark" && f.qno === ann.qno)
                );

                if (deletedMark) {
                    // Update score back to NA in the sheet
                    setQuestions((prevQ) =>
                        prevQ.map((q) => (q.qno === deletedMark.qno ? { ...q, obt: "NA" } : q))
                    );
                }

                return { ...prev, [pageIndex]: filtered };
            });
            return;
        }

        // D. Stamp Blank Page
        if (currentTool === "BLANK") {
            const pageProxy = pages[pageIndex];
            const viewport = pageProxy.getViewport({ scale: 1 });
            const midX = viewport.width / 2;
            const midY = viewport.height / 2;
            setAnnotations((prev) => {
                const currentList = prev[pageIndex] || [];
                const filtered = currentList.filter((ann) => ann.type !== "blank");
                return { ...prev, [pageIndex]: [...filtered, { type: "blank", x: midX, y: midY }] };
            });
            return;
        }

        // E. Check mark (R)
        if (currentTool === "R") {
            setAnnotations((prev) => ({
                ...prev,
                [pageIndex]: [...(prev[pageIndex] || []), { type: "check", x: cx, y: cy }],
            }));
            return;
        }

        // F. Cross mark (W)
        if (currentTool === "W") {
            setAnnotations((prev) => ({
                ...prev,
                [pageIndex]: [...(prev[pageIndex] || []), { type: "cross", x: cx, y: cy }],
            }));
            return;
        }
    };

    // 6. Draw Highlight (straight line)
    const handleHighlightDraw = (pageIndex, { x, y, x2 }) => {
        setAnnotations((prev) => ({
            ...prev,
            [pageIndex]: [
                ...(prev[pageIndex] || []),
                { type: "highlight", x, y, x2, color: "#e03030" },
            ],
        }));
    };

    // 7. Right Click default context menu
    const handleCanvasRightClick = (e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    // 8. Text annotation callbacks
    const handleTextUpdate = (pageIndex, idx, updated) => {
        setAnnotations((prev) => {
            const list = [...(prev[pageIndex] || [])];
            list[idx] = updated;
            return { ...prev, [pageIndex]: list };
        });
    };

    const handleTextDeselect = () => {
        if (!activeTextKey) return;
        const { pageIndex, annotationIndex } = activeTextKey;
        const ann = annotations[pageIndex]?.[annotationIndex];

        if (ann && !ann.text.trim()) {
            // Remove the empty annotation box
            setAnnotations((prev) => {
                const filtered = (prev[pageIndex] || []).filter((_, idx) => idx !== annotationIndex);
                return { ...prev, [pageIndex]: filtered };
            });
        }
        setActiveTextKey(null);
    };

    // 9. Mark confirmation inside MarkInputPopup
    const handleMarkConfirm = (valStr) => {
        if (!markPopup) return;
        const { pageIndex, x, y } = markPopup;
        const val = parseFloat(valStr);

        if (isNaN(val) || val < 0) {
            alert("Please enter a valid non-negative number.");
            return;
        }

        if (val > selectedQuestion.max) {
            alert(`Marks cannot exceed max of ${selectedQuestion.max}`);
            return;
        }

        // 1. Update score sheet
        setQuestions((prev) =>
            prev.map((q) => (q.qno === selectedQuestion.qno ? { ...q, obt: String(val) } : q))
        );

        // 2. Add mark badge annotation, replacing any existing mark badge for the same question number
        setAnnotations((prev) => {
            const updated = {};
            Object.keys(prev).forEach((pIdx) => {
                const list = prev[pIdx] || [];
                updated[pIdx] = list.filter(
                    (ann) => !(ann.type === "mark" && ann.qno === selectedQuestion.qno)
                );
            });

            const newMarkAnn = {
                type: "mark",
                x,
                y,
                qno: selectedQuestion.qno,
                obt: String(val),
                max: selectedQuestion.max,
            };
            updated[pageIndex] = [...(updated[pageIndex] || []), newMarkAnn];
            return updated;
        });

        setMarkPopup(null);
        const selectedIndex = questions.findIndex((question) => question.qno === selectedQuestion.qno);
        const nextUnmarked = [
            ...questions.slice(selectedIndex + 1),
            ...questions.slice(0, selectedIndex),
        ].find((question) => question.qno !== selectedQuestion.qno && question.obt === "NA");
        setSelectedQuestion(nextUnmarked || null);
        setCurrentTool("SELECT");
    };

    const advanceToNextScript = async () => {
        const bundleId = searchParams.get("bundleId");
        if (!bundleId) {
            navigate(reviewMode ? "/reviewer" : "/valuator");
            return;
        }
        const scripts = await (reviewMode ? listReviewerBundleScripts(bundleId) : listValuatorBundleScripts(bundleId));
        const next = scripts.find((script) => script.status === (reviewMode ? "VALUATED" : "PENDING"));
        if (!next) {
            alert(reviewMode
                ? "Bundle review is complete."
                : "All papers have been evaluated. Submit the bundle from your dashboard to finalize it.");
            navigate(reviewMode ? "/reviewer" : "/valuator");
            return;
        }
        setScriptId(next.id);
        setBookletId(next.answerBookletId);
        setQpCode(next.qpCode || "");
        const nextScheme = next.markingScheme || [];
        setMarkingScheme(nextScheme);
        const nextQuestions = createQuestionsForScript(nextScheme, next.marksJson);
        setQuestions(nextQuestions);
        setSelectedQuestion(nextQuestions.find((question) => question.obt === "NA") || null);
        await loadScriptFile(next.id, next.scannedFileName);
    };

    const handleExit = async () => {
        if (!window.confirm(
            reviewMode
                ? "Exit this paper? Saved review changes will remain saved."
                : "Exit this paper? Saved evaluations will stay in the bundle. Unfinished papers will remain assigned until you submit the bundle from your dashboard."
        )) {
            return;
        }

        navigate(reviewMode ? "/reviewer" : "/valuator");
    };

    // 10. High resolution (2x) PDF export via jsPDF
    const handleExportPdf = async () => {
        if (!pdfDataRef.current) {
            alert("The scanned answer sheet hasn't finished loading yet.");
            return;
        }

        let summary = "Evaluation Summary Matrix:\n";
        questions.forEach((q) => (summary += `Q${q.qno}: ${q.obt} / ${q.max}\n`));
        if (!window.confirm(`${summary}\nGenerate annotated PDF and submit evaluation?`)) {
            return;
        }

        setIsExporting(true);

        try {
            if (reviewMode) {
                if (!scriptId) throw new Error("No script is associated with this review.");
                const totalMarks = obtainedTotal;
                await reviewScript(scriptId, {
                    approved: true,
                    comments: "Reviewed and marks confirmed.",
                    marksJson: JSON.stringify(questions),
                    totalMarks,
                });
                await advanceToNextScript();
                return;
            }
            const { jsPDF } = await import("jspdf");
            const doc = await pdfjsLib.getDocument({ data: pdfDataRef.current.slice() }).promise;
            let pdfDoc = null;

            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const scale = 2.0; // Export at 2x resolution
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d");

                // Render page background
                await page.render({ canvasContext: ctx, viewport }).promise;

                // Draw overlay annotations
                const pageAnns = annotations[i - 1] || [];
                pageAnns.forEach((ann) => {
                    const cx = ann.x * scale;
                    const cy = ann.y * scale;

                    if (ann.type === "check") {
                        ctx.strokeStyle = "#28a050";
                        ctx.lineWidth = 3 * scale;
                        const sz = 14 * scale;
                        ctx.beginPath();
                        ctx.moveTo(cx - sz / 2, cy);
                        ctx.lineTo(cx, cy + sz / 2);
                        ctx.lineTo(cx + sz, cy - sz / 2);
                        ctx.stroke();
                    } else if (ann.type === "cross") {
                        ctx.strokeStyle = "#e03030";
                        ctx.lineWidth = 3 * scale;
                        const sz = 6 * scale;
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
                        const bw = 180 * scale;
                        const bh = 50 * scale;
                        ctx.strokeStyle = "#cc0000";
                        ctx.lineWidth = 3.5 * scale;
                        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
                        ctx.fillStyle = "rgba(255,255,255,0.92)";
                        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
                        ctx.fillStyle = "#cc0000";
                        ctx.font = `900 ${20 * scale}px sans-serif`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("BLANK PAGE", 0, 0);
                        ctx.restore();
                    } else if (ann.type === "highlight") {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(ann.x2 * scale, cy);
                        ctx.strokeStyle = "#e03030";
                        ctx.lineWidth = 2.5 * scale;
                        ctx.stroke();
                        ctx.restore();
                    } else if (ann.type === "mark") {
                        ctx.save();
                        const max = ann.max;
                        const obt = ann.obt;
                        const text = `[Q${ann.qno}: ${obt}/${max}]`;
                        const isFull = parseFloat(obt) >= parseFloat(max);
                        ctx.fillStyle = isFull ? "#28a050" : "#e03030";
                        ctx.font = `bold ${13 * scale}px sans-serif`;
                        ctx.textBaseline = "middle";
                        ctx.fillText(text, cx, cy);
                        ctx.restore();
                    } else if (ann.type === "text") {
                        ctx.save();
                        ctx.fillStyle = ann.color || "#e03030";
                        // Caveat font is loaded in index.html
                        ctx.font = `normal ${(ann.fontSize || 14) * scale}px Caveat, cursive`;
                        ctx.textBaseline = "top";

                        const paragraphs = ann.text.split("\n");
                        const maxWidth = ann.width * scale;
                        const lineHeight = (ann.fontSize || 14) * 1.35 * scale;
                        let textY = cy;

                        paragraphs.forEach((para) => {
                            const words = para.split(" ");
                            let line = "";
                            for (let n = 0; n < words.length; n++) {
                                const testLine = line + words[n] + " ";
                                const metrics = ctx.measureText(testLine);
                                if (metrics.width > maxWidth && n > 0) {
                                    ctx.fillText(line, cx, textY);
                                    line = words[n] + " ";
                                    textY += lineHeight;
                                } else {
                                    line = testLine;
                                }
                            }
                            ctx.fillText(line, cx, textY);
                            textY += lineHeight;
                        });
                        ctx.restore();
                    }
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const pdfWidth = viewport.width / scale;
                const pdfHeight = viewport.height / scale;

                if (i === 1) {
                    pdfDoc = new jsPDF({
                        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
                        unit: "pt",
                        format: [pdfWidth, pdfHeight],
                    });
                } else {
                    pdfDoc.addPage([pdfWidth, pdfHeight], pdfWidth > pdfHeight ? "landscape" : "portrait");
                }
                pdfDoc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
            }

            if (pdfDoc && scriptId) {
                const blob = pdfDoc.output("blob");
                try {
                    // Save the corrected copy back to the same server-side location - never
                    // downloaded to the evaluator's machine.
                    await submitScriptFile(scriptId, blob);
                } catch (fileErr) {
                    alert(`Failed to save the corrected PDF to the server: ${fileErr.message}`);
                    return;
                }

                const finalQuestions = questions.map((q) => q.obt === "NA" ? { ...q, obt: "0" } : q);
                setQuestions(finalQuestions);
                const totalMarks = obtainedTotal;
                try {
                    await submitScriptMarks(scriptId, {
                        marksJson: JSON.stringify(finalQuestions),
                        totalMarks,
                    });
                    await advanceToNextScript();
                    return;
                } catch (submitErr) {
                    alert(`Corrected PDF saved, but submitting marks to the server failed: ${submitErr.message}`);
                    return;
                }
            }

            alert("No script is associated with this session, so nothing was saved to the server.");
        } catch (err) {
            console.error(err);
            alert(`Error exporting PDF: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-screen flex flex-col overflow-hidden bg-[#eceef2] font-sans antialiased text-xs select-none">
            {scriptLoadError && (
                <div className="w-full bg-red-100 border-b border-red-400 text-red-700 text-center py-1.5 font-lexend text-[0.8em]">
                    {scriptLoadError}
                </div>
            )}
            {/* ── TOP TOOLBAR ── */}
            <Toolbar
                bookletId={bookletId}
                qpCode={qpCode}
                mode={reviewMode ? "REVIEW" : "VALUATION"}
                showBookletId={reviewMode}
                currentTool={currentTool}
                onToolChange={(tool) => {
                    handleTextDeselect();
                    setCurrentTool(tool);
                }}
                seconds={seconds}
                onExit={handleExit}
            />

            {/* ── WORKSPACE ── */}
            <div className="flex flex-1 overflow-hidden w-full">
                {/* LEFT PANEL: Score sheet */}
                <ScoreSheet
                    questions={questions}
                    markingScheme={markingScheme}
                    consideredQuestionNumbers={consideredQuestionNumbers}
                    sectionTotals={sectionTotals}
                    selectedQuestion={selectedQuestion}
                    onQuestionSelect={handleQuestionSelect}
                    maxTotal={maxTotal}
                    obtainedTotal={obtainedTotal}
                    standardHasMarks={standardHasMarks}
                />

                {/* RIGHT PANEL: PDF display container */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#b0b4bc]">
                    {/* Auto-load status bar (no manual upload - the scanned copy loads automatically) */}
                    <div className="bg-[#fafafa] border-b border-[#e4e8ee] px-4 py-2 shrink-0">
                        <div className="text-center text-[11px] font-medium text-gray-500">
                            {reviewMode ? (fileName || bookletId) : "Answer sheet"}
                        </div>
                        {pdfReady && !loadingPdf && !pdfError && (
                            <div className="text-center text-[10px] text-gray-400 mt-1">
                                {pages.length} pages loaded
                            </div>
                        )}
                        {pdfError && (
                            <div className="text-center text-[10px] text-red-500 mt-1 font-bold">
                                {pdfError}
                            </div>
                        )}
                        {loadingPdf && (
                            <div className="text-center text-[10px] text-blue-500 mt-1 animate-pulse font-bold">
                                Loading scanned answer sheet...
                            </div>
                        )}
                    </div>

                    {/* PDF Pages Viewer viewport */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-6">
                        {!pdfReady && !loadingPdf && !pdfError && (
                            <div className="mt-24 flex flex-col items-center gap-3 opacity-60">
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                                <div className="text-white font-bold text-sm">
                                    Open this page from a bundle or script to load its scanned sheet
                                </div>
                            </div>
                        )}

                        {!loadingPdf &&
                            !pdfError &&
                            pages.map((page, idx) => {
                                const pageAnns = annotations[idx] || [];
                                const isActivePageText =
                                    activeTextKey && activeTextKey.pageIndex === idx;

                                return (
                                    <div key={idx} className="relative">
                                        <PdfPageCanvas
                                            page={page}
                                            renderZoom={renderZoom}
                                            visualZoom={viewZoom}
                                            annotations={pageAnns}
                                            currentTool={currentTool}
                                            activeTextKey={
                                                isActivePageText ? activeTextKey.annotationIndex : null
                                            }
                                            onCanvasClick={(e) => handleCanvasClick(e, idx)}
                                            onCanvasRightClick={handleCanvasRightClick}
                                            onHighlightDraw={(coords) =>
                                                handleHighlightDraw(idx, coords)
                                            }
                                            onTextUpdate={(annIdx, updated) =>
                                                handleTextUpdate(idx, annIdx, updated)
                                            }
                                            onTextDeselect={handleTextDeselect}
                                            onTextSelect={(annIdx) =>
                                                setActiveTextKey({
                                                    pageIndex: idx,
                                                    annotationIndex: annIdx,
                                                })
                                            }
                                        />
                                        <div className="absolute top-2 right-2 bg-black/40 text-white text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none z-30">
                                            {idx + 1} / {pages.length}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Footer controls */}
                    <FooterBar
                        pagesCount={pages.length}
                        visualZoom={viewZoom}
                        onZoomIn={() => setViewZoom((z) => Math.min(200, z + 10))}
                        onZoomOut={() => setViewZoom((z) => Math.max(50, z - 10))}
                        onReject={() => {
                            if (window.confirm("Reject current booklet packet evaluation?")) {
                                alert("Packet designated Rejected.");
                            }
                        }}
                        onSubmit={handleExportPdf}
                        isExporting={isExporting}
                        submitLabel={reviewMode ? "CONFIRM & NEXT" : "SUBMIT & NEXT"}
                    />
                </div>
            </div>

            {/* Mark input popup */}
            {markPopup && selectedQuestion && (
                <MarkInputPopup
                    question={selectedQuestion}
                    clientX={markPopup.clientX}
                    clientY={markPopup.clientY}
                    onConfirm={handleMarkConfirm}
                    onCancel={() => {
                        setMarkPopup(null);
                        setSelectedQuestion(null);
                    }}
                />
            )}

            {/* Context menu for setting default styles */}
            {contextMenu && (
                <AnnotationContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    color={strokeColor}
                    size={strokeSize}
                    onColorChange={(color) => {
                        setStrokeColor(color);
                        setContextMenu(null);
                    }}
                    onSizeChange={(size) => {
                        setStrokeSize(size);
                    }}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
