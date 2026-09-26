import React, { useState } from "react";
import { lookupMarks } from "../../api/valuation";

export default function MarksLookupPage() {
    const [rollNumber, setRollNumber] = useState("");
    const [semester, setSemester] = useState("");
    const [course, setCourse] = useState("");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!rollNumber || !semester) return;
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const data = await lookupMarks(rollNumber.trim(), semester.trim(), course.trim());
            setResult(data);
        } catch (err) {
            setError(err.message || "Failed to fetch marks.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-2xl flex flex-col gap-6">
                <h1 className="font-lexend font-bold text-2xl text-center">Check Your Marks</h1>

                <form onSubmit={handleSearch} className="bg-white border border-gray-300 rounded-[0.4em] p-6 flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-4">
                        <input required placeholder="Roll Number" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                        <input required placeholder="Semester" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={semester} onChange={(e) => setSemester(e.target.value)} />
                        <input placeholder="Course (optional)" className="font-lexend text-sm border p-2.5 rounded-sm outline-none"
                            value={course} onChange={(e) => setCourse(e.target.value)} />
                    </div>
                    {error && <p className="font-lexend text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={loading}
                        className="bg-gray-900 text-white px-8 py-2.5 rounded-sm font-lexend font-medium text-sm tracking-wide cursor-pointer disabled:opacity-70">
                        {loading ? "SEARCHING..." : "GET MARKS"}
                    </button>
                </form>

                {result && (
                    <div className="bg-white border border-gray-300 rounded-[0.4em] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 font-lexend">
                            <span className="font-semibold">{result.rollNumber}</span>
                            {result.course && <span className="text-gray-500"> &nbsp;|&nbsp; {result.course}</span>}
                            <span className="text-gray-500"> &nbsp;|&nbsp; Semester {result.semester}</span>
                        </div>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-orange-100 text-[0.9em] font-lexend text-yellow-950 font-bold uppercase tracking-wider text-center">
                                    <th className="border border-gray-300 p-2.5 w-16">#</th>
                                    <th className="border border-gray-300 p-2.5">Subject</th>
                                    <th className="border border-gray-300 p-2.5 w-32">Marks</th>
                                    <th className="border border-gray-300 p-2.5 w-32">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.subjects.length === 0 && (
                                    <tr><td colSpan={4} className="border border-gray-300 p-3 text-center font-lexend text-sm text-gray-500">No subjects found for this course/semester.</td></tr>
                                )}
                                {result.subjects.map((s) => (
                                    <tr key={s.subjectOrder} className="text-[0.9em] font-lexend text-center h-10">
                                        <td className="border border-gray-300 p-2">{s.subjectOrder}</td>
                                        <td className="border border-gray-300 p-2 text-left px-4">{s.subjectName}</td>
                                        <td className="border border-gray-300 p-2 font-semibold">{s.marks}</td>
                                        <td className="border border-gray-300 p-2">
                                            {s.finalized ? (
                                                <span className="inline-block px-3 py-1 rounded-[0.3em] text-[10px] font-bold bg-green-100 text-green-700 border border-green-400">FINAL</span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 rounded-[0.3em] text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-400">PENDING</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
