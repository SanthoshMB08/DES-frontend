import { useState } from "react";
import { getBoeSubjectReport, getBoeSubjectReportExcel } from "../../api/valuation";

export default function BOEReportsTab({ subjects }) {
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadReport = async () => {
        if (!selectedSubjectId) return;
        setLoading(true);
        setError("");
        try {
            setReport(await getBoeSubjectReport(selectedSubjectId));
        } catch (loadError) {
            setError(loadError.message || "Failed to load subject results.");
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        if (!report) return;
        setError("");
        try {
            const file = await getBoeSubjectReportExcel(selectedSubjectId);
            const url = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${report.qpCode}-results.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (downloadError) {
            setError(downloadError.message || "Failed to download the Excel report.");
        }
    };

    const downloadPdf = async () => {
        if (!report) return;
        setError("");
        try {
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF();
            pdf.setFontSize(16);
            pdf.text(`${report.subjectName || report.subjectCode} Results`, 14, 18);
            pdf.setFontSize(10);
            pdf.text(`QP Code: ${report.qpCode} | Course: ${report.course} | Semester: ${report.semester}`, 14, 27);
            pdf.text(`Total papers: ${report.totalPapers} | Marked: ${report.markedPapers}`, 14, 34);
            let y = 47;
            pdf.setFont("helvetica", "bold");
            pdf.text("Role Number", 14, y);
            pdf.text("Marks", 110, y);
            pdf.text("Status", 145, y);
            pdf.setFont("helvetica", "normal");
            y += 8;
            report.results.forEach((result) => {
                if (y > 275) {
                    pdf.addPage();
                    y = 20;
                }
                pdf.text(String(result.roleNumber || "-").slice(0, 35), 14, y);
                pdf.text(result.marks == null ? "-" : String(result.marks), 110, y);
                pdf.text(String(result.status || "-"), 145, y);
                y += 7;
            });
            pdf.save(`${report.qpCode}-results.pdf`);
        } catch (exportError) {
            setError(exportError.message || "Failed to generate the PDF report.");
        }
    };

    return (
        <section className="space-y-4 rounded border bg-white p-5">
            <div>
                <h2 className="text-lg font-bold uppercase text-slate-900">Subject reports</h2>
                <p className="mt-1 text-sm text-slate-600">
                    View the paper count and role-number-wise marks for subjects in your course.
                </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-64 flex-1 text-sm font-semibold text-slate-700">
                    Subject
                    <select
                        value={selectedSubjectId}
                        onChange={(event) => {
                            setSelectedSubjectId(event.target.value);
                            setReport(null);
                        }}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
                    >
                        <option value="">Select subject</option>
                        {subjects.map((subject) => (
                            <option key={subject.subjectId} value={subject.subjectId}>
                                {subject.subjectCode} - {subject.subjectName} ({subject.qpCode})
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    disabled={!selectedSubjectId || loading}
                    onClick={loadReport}
                    className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {loading ? "Loading..." : "View report"}
                </button>
                {report && (
                    <>
                        <button type="button" onClick={downloadPdf} className="rounded border border-indigo-400 px-4 py-2 text-sm font-semibold text-indigo-800">
                            Download PDF
                        </button>
                        <button type="button" onClick={downloadExcel} className="rounded border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-800">
                            Download Excel
                        </button>
                    </>
                )}
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {report && (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded bg-slate-50 p-3 text-sm">
                        <span>QP: <strong>{report.qpCode}</strong></span>
                        <span>Total papers: <strong>{report.totalPapers}</strong></span>
                        <span>Marked: <strong>{report.markedPapers}</strong></span>
                    </div>
                    <div className="max-h-[55vh] overflow-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-slate-100">
                                <tr className="text-left">
                                    <th className="border p-2">Role number</th>
                                    <th className="border p-2">Marks</th>
                                    <th className="border p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.results.map((result, index) => (
                                    <tr key={`${result.roleNumber}-${index}`}>
                                        <td className="border p-2">{result.roleNumber}</td>
                                        <td className="border p-2">{result.marks ?? "-"}</td>
                                        <td className="border p-2">{result.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
