import React from "react";

export default function ScoreSheet({
    questions,
    selectedQuestion,
    onQuestionSelect,
    maxTotal,
    obtainedTotal,
}) {
    return (
        <div className="w-[210px] shrink-0 bg-white border-r border-[#d0d4dc] flex flex-col shadow-sm z-10">
            {/* Header */}
            <div className="bg-[#f8f8f0] border-b border-[#ddd] p-2 text-[10px] font-extrabold text-gray-500 tracking-widest uppercase">
                Score Sheet Matrix
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#fffbe0] sticky top-0 border-b border-[#e0dc90] text-[#665500] font-bold text-center z-10">
                            <th className="p-2 border-r border-[#e0dc90] text-[10px]">QNO</th>
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
