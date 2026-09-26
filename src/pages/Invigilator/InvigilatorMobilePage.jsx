import { useState } from "react";
import { FiCamera, FiCheckCircle, FiXCircle, FiLogOut } from "react-icons/fi";

import BarcodeScanner from "../../components/Invigilator/BarcodeScanner";
import { lookupByBarcode, scanByBarcode, markAbsent } from "../../api/invigilator";
import { getSession, clearSession } from "../../api/client";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
    PENDING: { bg: "#f1f5f9", text: "#64748b" },
    PRESENT: { bg: "#dcfce7", text: "#16a34a" },
    ABSENT: { bg: "#fee2e2", text: "#dc2626" },
};

// Barcode-first flow: scan student barcode -> pick exam match (if >1) -> scan booklet -> done
export default function InvigilatorMobilePage() {
    const navigate = useNavigate();
    const session = getSession();

    // "idle" -> "resolved" -> "done"
    const [step, setStep] = useState("idle");
    const [registerNumber, setRegisterNumber] = useState("");
    const [manualRegisterInput, setManualRegisterInput] = useState("");
    const [manualBookletInput, setManualBookletInput] = useState("");
    const [lookupResult, setLookupResult] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [scannerFor, setScannerFor] = useState(null); // "student" | "booklet"
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setStep("idle");
        setRegisterNumber("");
        setManualRegisterInput("");
        setManualBookletInput("");
        setLookupResult(null);
        setSelectedMatch(null);
        setLastSaved(null);
        setError("");
    };

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    const doLookup = async (regNo) => {
        const value = (regNo || manualRegisterInput).trim().toUpperCase();
        if (!value) return;
        setBusy(true);
        setError("");
        try {
            const result = await lookupByBarcode(value);
            setRegisterNumber(value);
            setLookupResult(result);
            if (result.matches?.length === 1) {
                setSelectedMatch(result.matches[0]);
            } else {
                setSelectedMatch(null);
            }
            setStep("resolved");
        } catch (err) {
            setError(err.message || "Lookup failed.");
        } finally {
            setBusy(false);
        }
    };

    const doScanBooklet = async (bookletValue) => {
        const value = (bookletValue || manualBookletInput).trim().toUpperCase();
        if (!value || !selectedMatch) return;
        setBusy(true);
        setError("");
        try {
            const result = await scanByBarcode({
                registerNumber,
                hallTicketExamId: selectedMatch.hallTicketExamId,
                answerBookletNumber: value,
            });
            setLastSaved(result);
            setStep("done");
        } catch (err) {
            setError(err.message || "Could not save this attendance record.");
        } finally {
            setBusy(false);
        }
    };

    const doMarkAbsent = async () => {
        if (!selectedMatch) return;
        if (!window.confirm(`Mark ${lookupResult?.studentName || registerNumber} absent for ${selectedMatch.qpCode}?`)) {
            return;
        }
        setBusy(true);
        setError("");
        try {
            await markAbsent({
                registerNumber,
                examDate: selectedMatch.examDate,
                qpCode: selectedMatch.qpCode,
            });
            setLastSaved({ resultType: "ABSENT" });
            setStep("done");
        } catch (err) {
            setError(err.message || "Could not mark absent.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="font-lexend font-semibold text-sm">Invigilator</p>
                    <p className="font-lexend text-xs text-blue-100">{session?.username || ""}</p>
                </div>
                <button onClick={handleLogout} className="p-2 bg-white/15 rounded-lg">
                    <FiLogOut size={16} />
                </button>
            </div>

            <div className="flex-1 px-5 py-6 flex flex-col gap-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 font-lexend text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* STEP: idle */}
                {step === "idle" && (
                    <>
                        <button
                            onClick={() => setScannerFor("student")}
                            disabled={busy}
                            className="flex flex-col items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl py-10 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-40"
                        >
                            <FiCamera size={36} />
                            <span className="font-lexend font-semibold text-lg">SCAN STUDENT BARCODE</span>
                        </button>

                        <div className="flex items-center gap-3 text-gray-400 font-lexend text-xs">
                            <div className="flex-1 h-px bg-gray-200" /> OR ENTER MANUALLY{" "}
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <Field label="Register Number">
                            <div className="flex gap-2">
                                <input
                                    value={manualRegisterInput}
                                    onChange={(e) => setManualRegisterInput(e.target.value.toUpperCase())}
                                    placeholder="e.g. 1RV22MC001"
                                    className="input flex-1 font-mono"
                                />
                                <button
                                    disabled={!manualRegisterInput.trim() || busy}
                                    onClick={() => doLookup()}
                                    className="bg-blue-600 disabled:opacity-40 text-white font-lexend font-medium px-5 rounded-xl"
                                >
                                    Go
                                </button>
                            </div>
                        </Field>
                    </>
                )}

                {/* STEP: resolved */}
                {step === "resolved" && lookupResult && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <p className="font-lexend text-xs text-gray-400 uppercase tracking-wide">Register Number</p>
                            <p className="font-mono font-semibold text-lg">{registerNumber}</p>

                            {lookupResult.found ? (
                                <>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="font-lexend font-medium">{lookupResult.studentName}</p>
                                    </div>

                                    {lookupResult.matches?.length === 0 && (
                                        <p className="font-lexend text-sm text-amber-600 mt-3">
                                            No exam scheduled for this student today.
                                        </p>
                                    )}

                                    {lookupResult.matches?.length > 1 && !selectedMatch && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                                            <p className="font-lexend text-xs text-gray-400 uppercase">
                                                This student has more than one exam today - pick one
                                            </p>
                                            {lookupResult.matches.map((m) => (
                                                <button
                                                    key={m.hallTicketExamId}
                                                    onClick={() => setSelectedMatch(m)}
                                                    className="border border-gray-300 rounded-xl p-3 text-left"
                                                >
                                                    <p className="font-lexend font-semibold">{m.qpCode}</p>
                                                    <p className="font-lexend text-sm text-gray-600">
                                                        {m.courseName || "Untitled"}
                                                    </p>
                                                    {m.examTime && (
                                                        <p className="font-lexend text-xs text-gray-500">{m.examTime}</p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {selectedMatch && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                                            <p className="font-lexend font-semibold text-blue-600">{selectedMatch.qpCode}</p>
                                            <p className="font-lexend text-sm text-gray-600">
                                                {selectedMatch.courseName || "Course name not available"}
                                            </p>
                                            <span
                                                className="self-start font-lexend text-xs font-bold px-2.5 py-1 rounded-full"
                                                style={{
                                                    backgroundColor: (STATUS_COLORS[selectedMatch.attendanceStatus] || STATUS_COLORS.PENDING).bg,
                                                    color: (STATUS_COLORS[selectedMatch.attendanceStatus] || STATUS_COLORS.PENDING).text,
                                                }}
                                            >
                                                {selectedMatch.attendanceStatus}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="font-lexend text-sm text-amber-600 mt-3">
                                    This barcode isn&apos;t recognized - it may not have been imported yet, or was misread.
                                </p>
                            )}
                        </div>

                        {selectedMatch && selectedMatch.attendanceStatus === "PENDING" && (
                            <>
                                <button
                                    onClick={() => setScannerFor("booklet")}
                                    disabled={busy}
                                    className="flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl py-6 disabled:opacity-40"
                                >
                                    <FiCamera size={26} />
                                    <span className="font-lexend font-semibold">SCAN ANSWER BOOKLET</span>
                                </button>

                                <Field label="Or type Answer Booklet Number">
                                    <div className="flex gap-2">
                                        <input
                                            value={manualBookletInput}
                                            onChange={(e) => setManualBookletInput(e.target.value.toUpperCase())}
                                            placeholder="e.g. ABK-2026-000101"
                                            className="input flex-1 font-mono"
                                        />
                                        <button
                                            disabled={!manualBookletInput.trim() || busy}
                                            onClick={() => doScanBooklet()}
                                            className="bg-green-600 disabled:opacity-40 text-white font-lexend font-medium px-5 rounded-xl"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </Field>

                                <button
                                    onClick={doMarkAbsent}
                                    disabled={busy}
                                    className="flex items-center justify-center gap-2 border border-red-300 text-red-600 font-lexend font-medium py-3 rounded-xl disabled:opacity-40"
                                >
                                    <FiXCircle size={18} /> MARK ABSENT
                                </button>
                            </>
                        )}

                        <button onClick={reset} className="text-gray-400 font-lexend text-sm underline">
                            Cancel and scan a different student
                        </button>
                    </div>
                )}

                {/* STEP: done */}
                {step === "done" && lastSaved && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <FiCheckCircle size={64} className="text-green-500" />
                        <p className="font-lexend font-semibold text-lg">
                            {lastSaved.resultType === "ABSENT" ? "Marked absent" : "Attendance saved"}
                        </p>
                        <p className="font-lexend text-sm text-gray-500">
                            {registerNumber}
                            {selectedMatch ? ` · ${selectedMatch.qpCode}` : ""}
                        </p>
                        <button
                            onClick={reset}
                            className="mt-4 flex items-center gap-2 bg-blue-600 text-white font-lexend font-semibold px-8 py-3.5 rounded-xl"
                        >
                            <FiCamera size={18} /> SCAN NEXT STUDENT
                        </button>
                    </div>
                )}
            </div>

            {scannerFor && (
                <BarcodeScanner
                    title={scannerFor === "student" ? "Scan Student Barcode" : "Scan Answer Booklet"}
                    onClose={() => setScannerFor(null)}
                    onResult={(text) => {
                        setScannerFor(null);
                        if (scannerFor === "student") {
                            doLookup(text);
                        } else {
                            doScanBooklet(text);
                        }
                    }}
                />
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="font-lexend text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
            {children}
        </label>
    );
}
