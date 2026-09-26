import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiCheckCircle, FiXCircle, FiLogOut, FiUserPlus, FiRefreshCw } from "react-icons/fi";

import QrScanner from "../../components/Invigilator/QrScanner";
import { lookupHallTicket, mobileScan, markAbsent, searchAttendance } from "../../api/invigilator";
import { getSession, clearSession } from "../../api/client";

const todayIso = () => new Date().toISOString().slice(0, 10);

// STEP MACHINE: session -> idle -> lookedUp -> done
export default function InvigilatorMobilePage() {
    const navigate = useNavigate();
    const session = getSession();

    // ---- Today's exam session (set once, stays for the whole sitting) ----
    const [semester, setSemester] = useState("");
    const [qpCode, setQpCode] = useState("");
    const [examDate, setExamDate] = useState(todayIso());
    const [sessionReady, setSessionReady] = useState(false);

    // ---- Per-student flow state ----
    const [step, setStep] = useState("idle"); // idle | lookedUp | done
    const [registerNumber, setRegisterNumber] = useState("");
    const [lookup, setLookup] = useState(null); // MobileLookupResponse
    const [studentName, setStudentName] = useState("");
    const [studentType, setStudentType] = useState("FRESHER");
    const [bookletNumber, setBookletNumber] = useState("");

    const [scannerFor, setScannerFor] = useState(null); // "student" | "booklet" | null
    const [error, setError] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const [tally, setTally] = useState({ present: 0, absent: 0 });

    const refreshTally = () => {
        if (!qpCode || !examDate) return;
        searchAttendance({ examDate, qpCode })
            .then((rows) => {
                const present = rows.filter((r) => r.status === "PRESENT").length;
                const absent = rows.filter((r) => r.status === "ABSENT").length;
                setTally({ present, absent });
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (sessionReady) refreshTally();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionReady]);

    const resetStudentFlow = () => {
        setStep("idle");
        setRegisterNumber("");
        setLookup(null);
        setStudentName("");
        setStudentType("FRESHER");
        setBookletNumber("");
        setError("");
        setLastResult(null);
    };

    const doLookup = async (regNo) => {
        const value = (regNo || registerNumber).trim().toUpperCase();
        if (!value) return;
        setRegisterNumber(value);
        setError("");
        setIsBusy(true);
        try {
            const result = await lookupHallTicket(value, semester);
            setLookup(result);
            if (result.found) {
                setStudentName(result.studentName || "");
                setStudentType(result.studentType || "FRESHER");
            }
            setStep("lookedUp");
        } catch (err) {
            setError(err.message || "Lookup failed");
        } finally {
            setIsBusy(false);
        }
    };

    const doSubmitScan = async (booklet) => {
        const bookletValue = (booklet || bookletNumber).trim().toUpperCase();
        if (!bookletValue) return;
        if (!lookup?.found && (!studentName.trim() || !studentType)) {
            setError("Enter the student's name and select Fresher/Repeater first - this is a new hall ticket.");
            return;
        }
        setBookletNumber(bookletValue);
        setError("");
        setIsBusy(true);
        try {
            const result = await mobileScan({
                registerNumber,
                studentName: lookup?.found ? undefined : studentName.trim(),
                studentType: lookup?.found ? undefined : studentType,
                semester,
                examDate,
                qpCode,
                answerBookletNumber: bookletValue,
            });
            setLastResult(result);
            setStep("done");
            refreshTally();
        } catch (err) {
            setError(err.message || "Could not save this attendance record.");
        } finally {
            setIsBusy(false);
        }
    };

    const doMarkAbsent = async () => {
        if (!registerNumber.trim()) return;
        setIsBusy(true);
        setError("");
        try {
            await markAbsent({ registerNumber: registerNumber.trim().toUpperCase(), examDate, qpCode });
            setLastResult({ resultType: "ABSENT" });
            setStep("done");
            refreshTally();
        } catch (err) {
            setError(err.message || "Could not mark absent.");
        } finally {
            setIsBusy(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    // ---------------- SESSION SETUP SCREEN ----------------
    if (!sessionReady) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col px-5 py-8">
                <h1 className="font-lexend text-xl font-bold text-center mb-1">Invigilator - Start Session</h1>
                <p className="font-lexend text-sm text-gray-500 text-center mb-8">
                    Set today's semester and QP code once - it applies to every student you scan.
                </p>

                <div className="flex flex-col gap-4 max-w-sm w-full mx-auto">
                    <Field label="Semester">
                        <input
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="e.g. 6"
                            className="input"
                        />
                    </Field>
                    <Field label="QP Code (today's subject)">
                        <input
                            value={qpCode}
                            onChange={(e) => setQpCode(e.target.value)}
                            placeholder="e.g. ECD006"
                            className="input"
                        />
                    </Field>
                    <Field label="Exam Date">
                        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input" />
                    </Field>

                    <button
                        disabled={!semester.trim() || !qpCode.trim()}
                        onClick={() => setSessionReady(true)}
                        className="mt-4 bg-blue-600 disabled:opacity-40 text-white font-lexend font-semibold py-3.5 rounded-xl"
                    >
                        START SCANNING
                    </button>
                </div>
            </div>
        );
    }

    // ---------------- MAIN SCAN SCREEN ----------------
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / session bar */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="font-lexend font-semibold text-sm">{qpCode} · Sem {semester}</p>
                    <p className="font-lexend text-xs text-blue-100">{examDate} · {session?.username}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSessionReady(false)}
                        className="text-xs font-lexend bg-white/15 px-3 py-1.5 rounded-lg"
                    >
                        Change
                    </button>
                    <button onClick={handleLogout} className="p-2 bg-white/15 rounded-lg">
                        <FiLogOut size={16} />
                    </button>
                </div>
            </div>

            {/* Tally strip */}
            <div className="flex divide-x divide-gray-200 bg-white border-b border-gray-200">
                <div className="flex-1 text-center py-2.5">
                    <p className="text-green-600 font-lexend font-bold text-lg">{tally.present}</p>
                    <p className="text-gray-500 font-lexend text-[11px] uppercase tracking-wide">Present</p>
                </div>
                <div className="flex-1 text-center py-2.5">
                    <p className="text-red-500 font-lexend font-bold text-lg">{tally.absent}</p>
                    <p className="text-gray-500 font-lexend text-[11px] uppercase tracking-wide">Absent</p>
                </div>
            </div>

            <div className="flex-1 px-5 py-6 flex flex-col gap-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 font-lexend text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* STEP: idle - scan or type register number */}
                {step === "idle" && (
                    <>
                        <button
                            onClick={() => setScannerFor("student")}
                            className="flex flex-col items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl py-10 shadow-sm active:scale-[0.99] transition-transform"
                        >
                            <FiCamera size={36} />
                            <span className="font-lexend font-semibold text-lg">SCAN STUDENT QR</span>
                        </button>

                        <div className="flex items-center gap-3 text-gray-400 font-lexend text-xs">
                            <div className="flex-1 h-px bg-gray-200" /> OR ENTER MANUALLY <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <Field label="Register Number">
                            <div className="flex gap-2">
                                <input
                                    value={registerNumber}
                                    onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                                    placeholder="e.g. 1RV22MC001"
                                    className="input flex-1 font-mono"
                                />
                                <button
                                    disabled={!registerNumber.trim() || isBusy}
                                    onClick={() => doLookup()}
                                    className="bg-blue-600 disabled:opacity-40 text-white font-lexend font-medium px-5 rounded-xl"
                                >
                                    Go
                                </button>
                            </div>
                        </Field>

                        {registerNumber.trim() && (
                            <button
                                onClick={doMarkAbsent}
                                disabled={isBusy}
                                className="flex items-center justify-center gap-2 border border-red-300 text-red-600 font-lexend font-medium py-3 rounded-xl"
                            >
                                <FiXCircle size={18} /> Mark {registerNumber.trim()} ABSENT for today
                            </button>
                        )}
                    </>
                )}

                {/* STEP: lookedUp - confirm/register student, then scan booklet */}
                {step === "lookedUp" && lookup && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <p className="font-lexend text-xs text-gray-400 uppercase tracking-wide">Register Number</p>
                            <p className="font-mono font-semibold text-lg">{registerNumber}</p>

                            {lookup.found ? (
                                <>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="font-lexend font-medium">{lookup.studentName}</p>
                                        <p className="font-lexend text-xs text-gray-500">
                                            {lookup.studentType} · Semester {lookup.semester}
                                        </p>
                                    </div>
                                    {lookup.exams?.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="font-lexend text-xs text-gray-400 uppercase mb-1">Papers written so far</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {lookup.exams.map((e) => (
                                                    <span
                                                        key={e.qpCode + e.examDate}
                                                        className={`text-xs font-lexend px-2 py-1 rounded-full ${
                                                            e.status === "PRESENT"
                                                                ? "bg-green-100 text-green-700"
                                                                : e.status === "ABSENT"
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
                                                        {e.qpCode}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                                    <p className="font-lexend text-sm text-amber-600 flex items-center gap-1.5">
                                        <FiUserPlus size={16} /> New hall ticket for semester {semester}
                                    </p>
                                    <Field label="Student Name">
                                        <input
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            placeholder="Full name"
                                            className="input"
                                        />
                                    </Field>
                                    <Field label="Student Type">
                                        <div className="flex gap-2">
                                            {["FRESHER", "REPEATER"].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setStudentType(t)}
                                                    className={`flex-1 py-2.5 rounded-xl font-lexend text-sm font-medium border ${
                                                        studentType === t
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-gray-600 border-gray-300"
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setScannerFor("booklet")}
                            className="flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl py-6"
                        >
                            <FiCamera size={26} />
                            <span className="font-lexend font-semibold">SCAN ANSWER BOOKLET</span>
                        </button>

                        <Field label="Or type Answer Booklet Number">
                            <div className="flex gap-2">
                                <input
                                    value={bookletNumber}
                                    onChange={(e) => setBookletNumber(e.target.value.toUpperCase())}
                                    placeholder="e.g. ABK-2026-000101"
                                    className="input flex-1 font-mono"
                                />
                                <button
                                    disabled={!bookletNumber.trim() || isBusy}
                                    onClick={() => doSubmitScan()}
                                    className="bg-green-600 disabled:opacity-40 text-white font-lexend font-medium px-5 rounded-xl"
                                >
                                    Save
                                </button>
                            </div>
                        </Field>

                        <button onClick={resetStudentFlow} className="text-gray-400 font-lexend text-sm underline">
                            Cancel
                        </button>
                    </div>
                )}

                {/* STEP: done */}
                {step === "done" && lastResult && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <FiCheckCircle size={64} className="text-green-500" />
                        <p className="font-lexend font-semibold text-lg">
                            {lastResult.resultType === "ABSENT" ? "Marked absent" : "Attendance saved"}
                        </p>
                        <p className="font-lexend text-sm text-gray-500">
                            {registerNumber} · {qpCode}
                            {lastResult.resultType === "NEW_HALL_TICKET" && " · new hall ticket created"}
                            {lastResult.resultType === "ALREADY_RECORDED" && " · was already recorded"}
                        </p>
                        <button
                            onClick={resetStudentFlow}
                            className="mt-4 flex items-center gap-2 bg-blue-600 text-white font-lexend font-semibold px-8 py-3.5 rounded-xl"
                        >
                            <FiRefreshCw size={18} /> SCAN NEXT STUDENT
                        </button>
                    </div>
                )}
            </div>

            {scannerFor && (
                <QrScanner
                    title={scannerFor === "student" ? "Scan Student QR" : "Scan Answer Booklet"}
                    onClose={() => setScannerFor(null)}
                    onResult={(text) => {
                        setScannerFor(null);
                        if (scannerFor === "student") {
                            doLookup(text);
                        } else {
                            doSubmitScan(text);
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
