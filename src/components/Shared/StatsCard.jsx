import React from "react";

const COLOR_MAP = {
    blue: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
    purple: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
    green: { bg: "bg-green-100", border: "border-green-400", text: "text-green-700" },
    yellow: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-600" },
    red: { bg: "bg-red-100", border: "border-red-400", text: "text-red-700" },
    indigo: { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-700" },
    emerald: { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-700" },
    orange: { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700" },
};

export default function StatCard({ value, label, color = "blue" }) {
    const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

    return (
        <div className={`font-lexend border ${c.bg} ${c.border} p-4 rounded-[0.3em] flex flex-col justify-between`}>
            <span className={`text-4xl font-bold tracking-tight ${c.text}`}>
                {String(value).padStart(2, '0')}
            </span>
            <span className={`text-[0.75em] font-bold uppercase ${c.text} mt-2`}>{label}</span>
        </div>
    );
}