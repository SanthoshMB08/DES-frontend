import React from "react";

export default function ScoreSheet({
    questions,
    selectedQuestion,
    onQuestionSelect,
    maxTotal,
    obtainedTotal,
    markingScheme = [],
    consideredQuestionNumbers = new Set(),
    sectionTotals = [],
}) {
    return (
        <div className="w-[210px] shrink-0 bg-white border-r border-[#d0d4dc] flex flex-col shadow-sm z-10">
            {/* Header */}
            <div className="bg-[#f8f8f0] border-b border-[#ddd] p-2 text-[10px] font-extrabold text-gray-500 tracking-widest uppercase">
                Score Sheet Matrix
            </div>
            <div className="border-b bg-blue-50 p-2">
                <label htmlFor="question-selector" className="block text-[9px] font-bold uppercase text-blue-800 mb-1">
                    Marking toolbox · question
                </label>
                <select
                    id="question-selector"
                    aria-label="Select question number"
                    value={selectedQuestion?.qno ?? ""}
                    onChange={(event) => onQuestionSelect(questions.find((question) => question.qno === event.target.value) || null)}
                    className="w-full rounded border border-blue-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800"
                >
                    <option value="" disabled>Select question</option>
                    {questions.map((question) => (
                        <option key={question.qno} value={question.qno}>
                            Q{question.qno} · max {question.max}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#fffbe0] sticky top-0 border-b border-[#e0dc90] text-[#665500] font-bold text-center z-10">
                            <th className="p-2 border-r border-[#e0dc90] text-[10px]">QNO</th>
                            {markingScheme.length > 0 && <th className="p-1 border-r border-[#e0dc90] text-[9px]">SECTION</th>}
                            <th className="p-2 border-r border-[#e0dc90] text-[10px]">MAX</th>
                            <th className="p-2 text-[10px]">OBT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q) => {
                            const isSelected = selectedQuestion?.qno === q.qno;
                            const hasMarks = q.obt !== "NA" && q.obt !== "BLK";

                            return (
                                <tr
                                    key={q.qno}
                                    onClick={() => onQuestionSelect(q)}
                                    className={`border-b text-center cursor-pointer transition-colors ${
                                        isSelected
                                            ? "bg-blue-50 border-blue-200"
                                            : "border-gray-100 hover:bg-gray-50"
                                    }`}
                                >
                                    <td
                                        className={`p-2 font-bold border-r border-gray-100 text-xs ${
                                            isSelected ? "text-blue-700" : "text-gray-700"
                                        }`}
                                    >
                                        {isSelected && (
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mr-1 mb-0.5 animate-pulse" />
                                        )}
                                        {q.qno}
                                    </td>
                                    {markingScheme.length > 0 && (
                                        <td className="p-1 border-r border-gray-100 text-[9px] text-gray-500">
                                            <div>{q.section}</div>
                                            <div className={consideredQuestionNumbers.has(q.qno) ? "text-green-700" : "text-amber-700"}>
                                                {consideredQuestionNumbers.has(q.qno) ? "COUNTED" : "OPTIONAL"}
                                            </div>
                                        </td>
                                    )}
                                    <td className="p-2 text-gray-400 font-mono border-r border-gray-100 text-xs">
                                        {String(q.max).padStart(2, "0")}
                                    </td>
                                    <td
                                        className={`p-1 text-center text-xs font-bold min-w-[50px] ${
                                            q.obt === "BLK"
                                                ? "text-red-500 italic"
                                                : hasMarks
                                                ? q.obt >= q.max
                                                    ? "text-green-700"
                                                    : "text-orange-600"
                                                : "text-gray-300"
                                        }`}
                                    >
                                        {q.obt === "NA" ? "0" : q.obt === "BLK" ? "BLK" : q.obt}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-[#d0d4dc] bg-emerald-50/40 shrink-0">
                {sectionTotals.map((section) => (
                    <div key={section.name} className="border-b border-[#d8ecc0] px-2 py-1 flex justify-between text-[10px] text-gray-600">
                        <span>{section.name}</span>
                        <span className="font-mono">{section.total} / {markingScheme.find((item) => item.name === section.name)?.maxMarks}</span>
                    </div>
                ))}
                <div className="border-b border-[#d8ecc0] p-2 flex justify-between font-bold text-[#3a5a1a] text-xs">
                    <span>OBTAINED</span>
                    <span className="font-mono text-green-900">
                        {obtainedTotal}
                    </span>
                </div>
                <div className="p-2 flex justify-between font-bold text-[#3a5a1a] text-xs">
                    <span>MAX TOTAL</span>
                    <span className="font-mono text-green-900">{maxTotal}</span>
                </div>
            </div>

            {/* Selected question hint */}
            {selectedQuestion && (
                <div className="border-t border-blue-200 bg-blue-600 p-2 text-[10px] text-white font-semibold text-center leading-tight">
                    <div className="animate-pulse">▼ Click PDF page</div>
                    <div>to mark Q{selectedQuestion.qno}</div>
                    <div className="opacity-75">(Max: {selectedQuestion.max} marks)</div>
                </div>
            )}
        </div>
    );
}
