import { useState } from "react";
import { FiUpload } from "react-icons/fi";
import { importHallTickets } from "../../api/invigilator";

export default function AdminHallTicketImportPanel() {
    const [fileName, setFileName] = useState("");
    const [jsonText, setJsonText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setJsonText(await file.text());
        setResult(null);
        setError("");
    };

    const handleImport = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setResult(null);
        try {
            const parsed = JSON.parse(jsonText);
            // Accept either the OCR module's own {"students": [...]} shape, or a
            // bare array of the same student records.
            const students = Array.isArray(parsed) ? parsed : parsed.students;
            if (!Array.isArray(students) || students.length === 0) {
                setError('Could not find a "students" array in this file.');
                return;
            }
            setResult(await importHallTickets(students));
        } catch (err) {
            if (err instanceof SyntaxError) {
                setError("That doesn't look like valid JSON - check the file and try again.");
            } else {
                setError(err.message || "Import failed.");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto max-w-3xl">
            <div>
                <h2 className="text-lg font-lexend font-bold tracking-wide uppercase">Import Hall Ticket Data</h2>
                <p className="font-lexend text-sm text-gray-500 mt-1">
                    Upload the JSON exported by the hall ticket OCR tool - this pre-loads every student's exam
                    schedule (QP code, course, exam date) so invigilators can just scan a barcode instead of
                    typing it all in by hand.
                </p>
            </div>

            <form onSubmit={handleImport} className="flex flex-col gap-4">
                <label
                    htmlFor="hallticket-json-file"
                    className="border border-dashed border-gray-400 rounded-[0.3em] px-4 py-8 font-lexend text-sm bg-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <FiUpload size={22} className="text-gray-500" />
                    <span className="text-gray-600">{fileName || "Click to select the exported JSON file"}</span>
                </label>
                <input id="hallticket-json-file" type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />

                <details className="font-lexend text-sm">
                    <summary className="cursor-pointer text-gray-500 text-xs uppercase tracking-wide">Or paste JSON directly</summary>
                    <textarea
                        rows={8}
                        className="w-full border rounded-sm p-3 font-mono text-xs outline-none mt-2"
                        placeholder='{"students": [...]}'
                        value={jsonText}
                        onChange={(e) => { setJsonText(e.target.value); setResult(null); setError(""); }}
                    />
                </details>

                {error && <p className="font-lexend text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={busy || !jsonText.trim()}
                    className="self-start bg-blue-200 border border-blue-500 text-blue-950 px-8 py-2.5 rounded-[0.3em] font-lexend font-medium text-sm cursor-pointer hover:bg-blue-300 disabled:opacity-60"
                >
                    {busy ? "IMPORTING..." : "IMPORT"}
                </button>
            </form>

            {result && (
                <div className="border border-gray-300 rounded-[0.3em] p-5 flex flex-col gap-3">
                    <h3 className="font-lexend font-semibold text-sm uppercase text-gray-700">Import complete</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <Stat label="Students Processed" value={result.studentsProcessed} />
                        <Stat label="Hall Tickets Created" value={result.hallTicketsCreated} />
                        <Stat label="Exam Rows Created" value={result.examRowsCreated} />
                        <Stat label="Exam Rows Updated" value={result.examRowsUpdated} />
                    </div>
                    {result.warnings?.length > 0 && (
                        <div className="mt-2">
                            <p className="font-lexend text-xs font-semibold uppercase text-amber-700">
                                {result.warnings.length} warning{result.warnings.length === 1 ? "" : "s"}
                            </p>
                            <ul className="mt-1 max-h-40 overflow-y-auto text-xs font-mono text-amber-700 list-disc list-inside">
                                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="border rounded-[0.3em] p-3">
            <p className="font-lexend text-2xl font-bold text-blue-700">{value}</p>
            <p className="font-lexend text-[11px] text-gray-500 uppercase tracking-wide mt-1">{label}</p>
        </div>
    );
}
