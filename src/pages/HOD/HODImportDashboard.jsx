import { useEffect, useState } from "react";
import { FiLogOut, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { importHodStudentsExcel, listHodImportBatches } from "../../api/academic";
import { logout } from "../../api/auth";
import { getSession } from "../../api/client";
import { importHodExamRegistrationsExcel } from "../../api/academic";

const IMPORTS = {
    students: {
        title: "Student and course registration",
        description: "Import student records and assign every row to the selected course batch.",
        headers: "registerNumber, studentName, dateOfBirth, category, gender",
        accepted: ".xlsx, .xls",
    },
    hallTickets: {
        title: "Exam registrations",
        description: "Each data row must contain a student's USN, an existing QP code, and the exam year-month. The student and QP code must already exist. A booklet number is assigned later when a paper is scanned.",
        headers: "USN, qpCode, yearMonth",
        example: "Example row: 1AB23CS001, CS501, 2026-10",
        accepted: ".xlsx, .xls",
    },
};

export default function HODImportDashboard() {
    const navigate = useNavigate();
    const session = getSession();
    const [kind, setKind] = useState("students");
    const [batches, setBatches] = useState([]);
    const [batchId, setBatchId] = useState("");
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        listHodImportBatches()
            .then((items) => {
                if (!active) return;
                setBatches(items);
                if (items.length === 1) setBatchId(items[0].id);
            })
            .catch((err) => {
                if (active) setError(err.message || "Could not load course batches.");
            });
        return () => { active = false; };
    }, []);

    const activeImport = IMPORTS[kind];

    const changeKind = (nextKind) => {
        setKind(nextKind);
        setFile(null);
        setResult(null);
        setError("");
    };

    const selectFile = (event) => {
        const nextFile = event.target.files?.[0] || null;
        setFile(nextFile);
        setResult(null);
        setError("");
    };

    const submitImport = async () => {
        if (!file) return;
        if (kind === "students" && !batchId) {
            setError("Choose the course batch before importing students.");
            return;
        }
        const selectedBatch = batches.find((batch) => batch.id === batchId);
        const confirmation = kind === "students"
            ? `Import ${file.name} and assign all students to ${selectedBatch?.label} (${selectedBatch?.programName})? Existing register numbers will be updated.`
            : `Import student QP registrations from ${file.name}? Students and QP codes will be verified first; duplicate registrations will not be added.`;
        if (!window.confirm(`${confirmation}\n\nContinue?`)) return;

        setBusy(true);
        setError("");
        setResult(null);
        try {
            const response = kind === "students"
                ? await importHodStudentsExcel(file, batchId)
                : await importHodExamRegistrationsExcel(file);
            setResult(response);
            setFile(null);
        } catch (err) {
            setError(err.message || "The spreadsheet could not be imported.");
        } finally {
            setBusy(false);
        }
    };

    const signOut = () => {
        logout();
        navigate("/login");
    };

    return (
        <main className="min-h-screen bg-slate-100 font-lexend text-slate-800">
            <header className="flex items-center justify-between bg-white border-b px-6 py-4">
                <div>
                    <h1 className="font-bold text-lg">HOD Data Import</h1>
                    <p className="text-sm text-slate-500">Signed in as {session?.username || "HOD"}</p>
                </div>
                <button type="button" onClick={signOut} className="flex items-center gap-2 border rounded px-3 py-2 text-sm">
                    <FiLogOut /> Sign out
                </button>
            </header>

            <section className="max-w-4xl mx-auto p-6 flex flex-col gap-5">
                <div>
                    <h2 className="text-xl font-bold">Upload pre-data from Excel</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Select the import type, prepare the first worksheet using the column names below, review the selected course information, then confirm the import.
                    </p>
                </div>

                <div className="flex gap-2" role="tablist" aria-label="Excel import type">
                    <button type="button" role="tab" aria-selected={kind === "students"} onClick={() => changeKind("students")}
                        className={`rounded px-4 py-2 border ${kind === "students" ? "bg-blue-700 text-white" : "bg-white"}`}>
                        Student list
                    </button>
                    <button type="button" role="tab" aria-selected={kind === "hallTickets"} onClick={() => changeKind("hallTickets")}
                        className={`rounded px-4 py-2 border ${kind === "hallTickets" ? "bg-blue-700 text-white" : "bg-white"}`}>
                        Exam registration
                    </button>
                </div>

                <div className="bg-white border rounded p-5 flex flex-col gap-4">
                    <div>
                        <h3 className="font-semibold">{activeImport.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{activeImport.description}</p>
                    </div>

                    {kind === "students" && (
                        <>
                            <label className="flex flex-col gap-1 text-sm font-medium">
                                Course batch
                                <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="border rounded p-2 bg-white">
                                    <option value="">Choose the correct course batch</option>
                                    {batches.map((batch) => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.label} — {batch.programName} ({batch.admissionYear})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {!error && batches.length === 0 && (
                                <p className="text-sm text-amber-800">
                                    No course batches are available yet. Ask an admin to create the program batch in Academic Setup.
                                </p>
                            )}
                        </>
                    )}

                    <div className="rounded bg-slate-50 border p-3 text-sm">
                        <p className="font-semibold">Required column headers in row 1</p>
                        <code className="block mt-1 text-xs break-words">{activeImport.headers}</code>
                        {activeImport.example && (
                            <p className="text-xs text-slate-600 mt-2">
                                Example data row: <code>{activeImport.example}</code>. Do not leave required cells blank; enter year-month as YYYY-MM.
                            </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">Use .xlsx or .xls. Maximum 10 MB and 5,000 data rows.</p>
                    </div>

                    <label className="flex items-center gap-3 border border-dashed rounded p-5 cursor-pointer hover:bg-slate-50">
                        <FiUpload size={20} />
                        <span className="text-sm">{file?.name || `Choose an Excel file (${activeImport.accepted})`}</span>
                        <input type="file" accept=".xlsx,.xls" onChange={selectFile} className="sr-only" />
                    </label>

                    {busy && (
                        <p role="status" aria-live="polite" className="text-sm text-blue-800">
                            Upload received. Validating rows and saving records; please wait for the completion message.
                        </p>
                    )}
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <button type="button" disabled={busy || !file || (kind === "students" && !batchId)} onClick={submitImport}
                        className="self-start rounded bg-blue-700 text-white px-5 py-2 font-semibold disabled:opacity-50">
                        {busy ? "UPLOADING AND PROCESSING..." : "REVIEW AND IMPORT"}
                    </button>
                </div>

                {result && (
                    <div role="status" className="bg-green-50 border border-green-300 rounded p-5">
                        <h3 className="font-semibold text-green-900">
                            {"registrationsCreated" in result && result.registrationsCreated === 0 && result.registrationsAlreadyPresent > 0
                                ? "Import completed — no new registrations"
                                : "Import completed"}
                        </h3>
                        {"studentsProcessed" in result ? (
                            <p className="text-sm mt-2">
                                {result.studentsProcessed} student rows processed: {result.studentsCreated} new, {result.studentsUpdated} updated. Existing students were updated.
                            </p>
                        ) : "registrationsCreated" in result ? (
                            <p className="text-sm mt-2">
                                {result.rowsProcessed} rows processed: {result.registrationsCreated} registrations added and {result.registrationsAlreadyPresent} already existed. Existing registrations were skipped.
                            </p>
                        ) : (
                            <p className="text-sm mt-2">
                                {result.studentsProcessed} students; {result.hallTicketsCreated} hall tickets and {result.examRowsCreated} exam rows created; {result.examRowsUpdated} exam rows updated.
                            </p>
                        )}
                        {result.warnings?.length > 0 && (
                            <ul className="mt-3 text-sm text-amber-800 list-disc pl-5">
                                {result.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}
