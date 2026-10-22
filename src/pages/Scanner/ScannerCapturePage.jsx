import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiChevronRight, FiRefreshCw, FiUpload } from "react-icons/fi";
import { getSession } from "../../api/client";
import { logout as apiLogout } from "../../api/auth";
import { lookupScannerRegistrations, submitScannedBooklet } from "../../api/valuation";
import CameraFeed from "./CameraFeed";
import { normalizeBookletNumber, parseIdentityQr, parsePageQr } from "./scannerQr";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const MAX_BOOKLET_PDF_BYTES = 30 * 1024 * 1024;

async function capturePageImage() {
    const video = document.querySelector("#scanner-camera video");
    if (!(video instanceof HTMLVideoElement) || !video.videoWidth || !video.videoHeight) {
        throw new Error("Camera is not ready yet. Wait for the live preview and try again.");
    }

    const scale = Math.min(1, 1400 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the page capture.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
    if (!blob) throw new Error("Could not capture this page. Please try again.");
    return URL.createObjectURL(blob);
}

async function buildBookletPdf(pages) {
    const { jsPDF } = await import("jspdf");
    const images = await Promise.all(pages.map(async (page) => {
        const response = await fetch(page.imageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ data: reader.result, url: page.imageUrl });
            reader.onerror = () => reject(new Error(`Could not load captured page ${page.number}.`));
            reader.readAsDataURL(blob);
        });
    }));

    const firstDimensions = new jsPDF().getImageProperties(images[0].data);
    const firstOrientation = firstDimensions.width > firstDimensions.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: firstOrientation, compress: true });
    images.forEach((image, index) => {
        const dimensions = pdf.getImageProperties(image.data);
        const orientation = dimensions.width > dimensions.height ? "landscape" : "portrait";
        if (index > 0) pdf.addPage("a4", orientation);
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        const scale = Math.min(width / dimensions.width, height / dimensions.height);
        const imageWidth = dimensions.width * scale;
        const imageHeight = dimensions.height * scale;
        pdf.addImage(image.data, "JPEG", (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
    });
    return pdf.output("blob");
}

function StepHeading({ number, title, detail, active }) {
    return (
        <div className={`flex gap-3 ${active ? "text-indigo-950" : "text-slate-400"}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>
                {number}
            </span>
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-slate-500">{detail}</p>
            </div>
        </div>
    );
}

export default function ScannerCapturePage() {
    const navigate = useNavigate();
    const session = getSession();
    const [step, setStep] = useState("identity");
    const [identity, setIdentity] = useState({ usn: "", qpCode: "", examYearMonth: "" });
    const [registrationOptions, setRegistrationOptions] = useState([]);
    const [registrationId, setRegistrationId] = useState("");
    const [bookletNumber, setBookletNumber] = useState("");
    const [pageCount, setPageCount] = useState(40);
    const [pages, setPages] = useState([]);
    const [replacePage, setReplacePage] = useState(null);
    const [detectedPage, setDetectedPage] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [identityRaw, setIdentityRaw] = useState("");
    const [logoutVisible, setLogoutVisible] = useState(false);
    const pageCodeRef = useRef({ value: null, time: 0 });
    const pageUrlsRef = useRef(new Set());

    const nextPageNumber = useMemo(() => {
        if (replacePage) return replacePage;
        return pages.length + 1;
    }, [pages.length, replacePage]);

    const selectedRegistration = registrationOptions.find((option) => option.id === registrationId);
    const availableOptions = registrationOptions.filter((option) => !option.bookletAssigned);
    const cameraActive = ["identity", "booklet", "pages"].includes(step);

    const editIdentity = (field, value) => {
        setIdentity((current) => ({ ...current, [field]: value }));
        setIdentityRaw("");
        setRegistrationOptions([]);
        setRegistrationId("");
        setError("");
        setMessage("");
    };

    useEffect(() => () => {
        pageUrlsRef.current.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
    }, []);

    const findRegistrations = useCallback(async (formIdentity) => {
        setLoading(true);
        setError("");
        try {
            const options = await lookupScannerRegistrations(formIdentity);
            setRegistrationOptions(options);
            const available = options.filter((option) => !option.bookletAssigned);
            if (available.length === 1) setRegistrationId(available[0].id);
            else setRegistrationId("");
            if (available.length === 0) {
                setError(options.length
                    ? "This examination registration already has a booklet linked."
                    : "No matching examination registration was found. Check the scanned USN and QP code.");
            } else if (available.length > 1 && !formIdentity.examYearMonth) {
                setMessage("More than one exam session matches. Select the correct year-month before continuing.");
            } else {
                setMessage("");
            }
        } catch (requestError) {
            setError(requestError.message || "Could not look up the exam registration.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDecode = useCallback((decodedText, decodedResult) => {
        const text = String(decodedText || "").trim();
        const format = decodedResult?.result?.format?.format;
        if (step === "identity" && format === 0) {
            const parsed = parseIdentityQr(text);
            if (!parsed || text === identityRaw) return;
            setIdentity(parsed);
            setIdentityRaw(text);
            setMessage("Hall-ticket QR read. Checking matching exam registrations…");
            findRegistrations(parsed);
            return;
        }
        if (step === "booklet") {
            if (format === 0 || !text || text === identityRaw) return;
            setBookletNumber(normalizeBookletNumber(text));
            setMessage("Booklet barcode read. Confirm the number below.");
            return;
        }
        if (step === "pages" && format === 0) {
            const number = parsePageQr(text);
            if (number !== null) {
                pageCodeRef.current = { value: number, time: Date.now() };
                setDetectedPage(number);
                if (number === nextPageNumber) {
                    setError("");
                    setMessage(`Page ${number} detected. Capture it when the sheet is positioned.`);
                } else {
                    setError(`Page ${number} is out of order. Scan page ${nextPageNumber} next.`);
                    setMessage("");
                }
            }
        }
    }, [step, identityRaw, findRegistrations, nextPageNumber]);

    const continueToBooklet = () => {
        setError("");
        setMessage("");
        setStep("booklet");
    };

    const continueToPages = () => {
        if (!normalizeBookletNumber(bookletNumber)) {
            setError("Scan or enter the booklet number before continuing.");
            return;
        }
        if (!registrationId) {
            setError("Select a valid, unlinked exam registration before continuing.");
            return;
        }
        setError("");
        setMessage("Scan one page at a time. The page QR must match the expected page number.");
        setDetectedPage(null);
        pageCodeRef.current = { value: null, time: 0 };
        setStep("pages");
    };

    const captureCurrentPage = async () => {
        setError("");
        const current = pageCodeRef.current;
        if (!current.value || Date.now() - current.time > 1800) {
            setError("Hold the page QR in view until its page number is detected, then capture.");
            return;
        }
        if (current.value !== nextPageNumber) {
            setError(`Page ${current.value} is out of order. Scan page ${nextPageNumber} next.`);
            return;
        }

        try {
            const imageUrl = await capturePageImage();
            pageUrlsRef.current.add(imageUrl);
            const replacedPage = pages.find((page) => page.number === current.value);
            if (replacedPage) {
                URL.revokeObjectURL(replacedPage.imageUrl);
                pageUrlsRef.current.delete(replacedPage.imageUrl);
            }
            setPages((existing) => {
                const updated = existing.filter((page) => page.number !== current.value);
                updated.push({ number: current.value, imageUrl });
                updated.sort((left, right) => left.number - right.number);
                return updated;
            });
            setReplacePage(null);
            setDetectedPage(null);
            pageCodeRef.current = { value: null, time: 0 };
            setMessage(`Captured page ${current.value}. ${current.value < pageCount ? "Move to the next page." : "All pages captured; verify the booklet."}`);
        } catch (captureError) {
            setError(captureError.message || "Page capture failed.");
        }
    };

    const startReplacement = (pageNumber) => {
        setReplacePage(pageNumber);
        setDetectedPage(null);
        pageCodeRef.current = { value: null, time: 0 };
        setMessage(`Rescan page ${pageNumber} to replace the current image.`);
        setError("");
        setStep("pages");
    };

    const verifyPages = () => {
        const numbers = new Set(pages.map((page) => page.number));
        const missing = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => !numbers.has(number));
        if (missing.length) {
            setError(`Pages missing or out of sequence: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}`);
            return;
        }
        setError("");
        setMessage("Check each page image below. Replace any unclear page before submitting.");
        setStep("verify");
    };

    const submitBooklet = async () => {
        setLoading(true);
        setError("");
        try {
            const pdf = await buildBookletPdf(pages);
            if (pdf.size > MAX_BOOKLET_PDF_BYTES) {
                throw new Error("The generated PDF exceeds the 30 MB upload limit. Retake the pages with the booklet closer to the camera.");
            }
            const pdfFile = new File([pdf], `${normalizeBookletNumber(bookletNumber)}.pdf`, { type: "application/pdf" });
            const result = await submitScannedBooklet({
                registrationId,
                bookletNumber: normalizeBookletNumber(bookletNumber),
                file: pdfFile,
            });
            setMessage(`Booklet ${result.bookletNumber} was saved and linked to ${identity.usn}.`);
            setStep("done");
        } catch (submissionError) {
            setError(submissionError.message || "Could not submit this booklet.");
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        pageUrlsRef.current.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
        pageUrlsRef.current.clear();
        setStep("identity");
        setIdentity({ usn: "", qpCode: "", examYearMonth: "" });
        setRegistrationOptions([]);
        setRegistrationId("");
        setBookletNumber("");
        setPageCount(40);
        setPages([]);
        setReplacePage(null);
        setDetectedPage(null);
        setIdentityRaw("");
        setMessage("");
        setError("");
    };

    const logout = (event) => {
        event.preventDefault();
        apiLogout();
        navigate("/login");
    };

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900">
            <header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white sm:px-8">
                <div>
                    <p className="text-sm font-semibold tracking-wide">DIGITAL EVALUATION SYSTEM</p>
                    <p className="text-xs text-slate-300">Booklet scanner · {session?.username || "Scanner"}</p>
                </div>
                <nav className="flex gap-2">
                    <button onClick={() => navigate("/scanner/history")} className="rounded-md border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800">SCANNED SCRIPTS</button>
                    <button onClick={() => navigate("/scanner/qp-folders")} className="rounded-md border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800">QP FOLDERS</button>
                    <button onClick={() => setLogoutVisible(true)} className="rounded-md bg-slate-700 px-3 py-2 text-xs hover:bg-slate-600">LOG OUT</button>
                </nav>
            </header>

            <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[300px_1fr] lg:p-8">
                <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
                    <h1 className="mb-5 text-lg font-bold">Capture a booklet</h1>
                    <div className="space-y-5">
                        <StepHeading number="1" title="Student & exam" detail="Scan the hall-ticket QR" active={step === "identity"} />
                        <StepHeading number="2" title="Booklet number" detail="Scan the booklet barcode" active={step === "booklet"} />
                        <StepHeading number="3" title="Capture pages" detail={`${pages.length} of ${pageCount} pages captured`} active={step === "pages" || step === "verify"} />
                        <StepHeading number="4" title="Verify & submit" detail="Review the ordered PDF" active={step === "verify" || step === "done"} />
                    </div>
                    <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-950">
                        Keep each page in order. The printed page QR is checked before the image is captured.
                    </div>
                </aside>

                <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
                    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
                    {message && <div role="status" className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{message}</div>}

                    {step !== "verify" && step !== "done" && (
                        <div className="mb-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
                            <div id="scanner-camera"><CameraFeed onDecode={handleDecode} active={cameraActive} /></div>
                            <div className="space-y-4">
                                {step === "identity" && (
                                    <>
                                        <h2 className="font-semibold">Scan exam QR code</h2>
                                        <p className="text-sm text-slate-600">A hall-ticket QR containing USN and QP code is read automatically. If it uses a format this scanner cannot interpret, enter the printed values below.</p>
                                        <label className="block text-xs font-semibold text-slate-600">USN / REGISTER NUMBER
                                            <input className={`${inputClass} mt-1`} value={identity.usn} onChange={(event) => editIdentity("usn", event.target.value.toUpperCase())} />
                                        </label>
                                        <label className="block text-xs font-semibold text-slate-600">QP CODE
                                            <input className={`${inputClass} mt-1`} value={identity.qpCode} onChange={(event) => editIdentity("qpCode", event.target.value.toUpperCase())} />
                                        </label>
                                        <label className="block text-xs font-semibold text-slate-600">EXAM YEAR-MONTH (if known)
                                            <input className={`${inputClass} mt-1`} placeholder="YYYY-MM" value={identity.examYearMonth} onChange={(event) => editIdentity("examYearMonth", event.target.value)} />
                                        </label>
                                        <button type="button" disabled={loading || !identity.usn || !identity.qpCode} onClick={() => findRegistrations(identity)} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                                            {loading ? "LOOKING UP…" : "FIND EXAM REGISTRATION"}
                                        </button>
                                    </>
                                )}
                                {step === "booklet" && (
                                    <>
                                        <h2 className="font-semibold">Scan booklet barcode</h2>
                                        <p className="text-sm text-slate-600">Barcode readers support common linear formats. You can also type the booklet number.</p>
                                        <label className="block text-xs font-semibold text-slate-600">BOOKLET NUMBER
                                            <input className={`${inputClass} mt-1`} value={bookletNumber} onChange={(event) => setBookletNumber(normalizeBookletNumber(event.target.value))} />
                                        </label>
                                        <button type="button" onClick={continueToPages} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">CONTINUE TO PAGES</button>
                                    </>
                                )}
                                {step === "pages" && (
                                    <>
                                        <h2 className="font-semibold">{replacePage ? `Replace page ${replacePage}` : `Capture page ${nextPageNumber}`}</h2>
                                        <p className="text-sm text-slate-600">Detected page: <strong>{detectedPage ?? "—"}</strong>. Only the expected QR page number can be captured.</p>
                                        <label className="block text-xs font-semibold text-slate-600">TOTAL PAGES
                                            <input type="number" min="1" max="200" className={`${inputClass} mt-1`} value={pageCount} onChange={(event) => setPageCount(Math.max(1, Number(event.target.value) || 1))} disabled={pages.length > 0 || replacePage !== null} />
                                        </label>
                                        <button type="button" disabled={detectedPage !== nextPageNumber} onClick={captureCurrentPage} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                                            CAPTURE PAGE {nextPageNumber}
                                        </button>
                                        {!replacePage && pages.length === pageCount && (
                                            <button type="button" onClick={verifyPages} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">VERIFY BOOKLET</button>
                                        )}
                                    </>
                                )}
                                {step === "identity" && availableOptions.length > 1 && (
                                    <label className="block text-xs font-semibold text-slate-600">SELECT EXAM SESSION
                                        <select className={`${inputClass} mt-1`} value={registrationId} onChange={(event) => setRegistrationId(event.target.value)}>
                                            <option value="">Select year-month</option>
                                            {availableOptions.map((option) => <option key={option.id} value={option.id}>{option.examYearMonth}</option>)}
                                        </select>
                                    </label>
                                )}
                                {step === "identity" && selectedRegistration && (
                                    <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                                        {selectedRegistration.usn} · {selectedRegistration.qpCode} · {selectedRegistration.examYearMonth}
                                    </div>
                                )}
                                {step === "identity" && registrationId && (
                                    <button type="button" onClick={continueToBooklet} className="w-full rounded-lg border border-indigo-300 px-4 py-2.5 text-sm font-semibold text-indigo-800">CONTINUE TO BOOKLET BARCODE</button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === "verify" && (
                        <>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-bold">Verify captured pages</h2>
                                    <p className="text-sm text-slate-600">{pages.length} pages, ordered 1 through {pageCount} · {identity.usn} · {bookletNumber}</p>
                                </div>
                                <button type="button" onClick={() => setStep("pages")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">BACK TO SCAN</button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {pages.map((page, index) => (
                                    <article id={`page-${page.number}`} key={page.number} className="overflow-hidden rounded-xl border border-slate-200">
                                        <img src={page.imageUrl} alt={`Captured page ${page.number}`} className="h-64 w-full bg-slate-100 object-contain" />
                                        <div className="flex items-center justify-between gap-2 p-3">
                                            <span className="font-semibold">Page {page.number}</span>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => startReplacement(page.number)} className="flex items-center gap-1 rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-800"><FiRefreshCw /> Replace</button>
                                                <button type="button" onClick={() => document.getElementById(`page-${pages[index + 1]?.number || page.number}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} disabled={index === pages.length - 1} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs disabled:opacity-40">Next <FiChevronRight /></button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button type="button" disabled={loading} onClick={submitBooklet} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                                    <FiUpload /> {loading ? "CREATING PDF & UPLOADING…" : "SUBMIT VERIFIED BOOKLET"}
                                </button>
                            </div>
                        </>
                    )}

                    {step === "done" && (
                        <div className="mx-auto max-w-lg py-12 text-center">
                            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><FiCheck size={28} /></span>
                            <h2 className="text-2xl font-bold">Booklet submitted</h2>
                            <p className="mt-2 text-slate-600">{message}</p>
                            <button type="button" onClick={resetScanner} className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">SCAN ANOTHER BOOKLET</button>
                        </div>
                    )}
                </section>
            </div>

            {logoutVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={logout} className="w-full max-w-sm rounded-xl bg-white p-6">
                        <h2 className="mb-2 font-bold">Log out</h2>
                        <p className="mb-4 text-sm text-slate-600">Are you sure you want to end this session?</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setLogoutVisible(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Log out</button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
