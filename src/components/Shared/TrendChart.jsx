import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function TrendChart({
    title,
    subtitle,
    data,
    xKey = "day",
    dataKey = "scripts",
    color = "#2563eb",
}) {
    const gradientId = `trendFill-${dataKey}-${color.replace("#", "")}`;

    return (
        <div className="flex-1 min-h-[280px] border border-gray-300 rounded-[0.3em] p-4 flex flex-col gap-4">
            <div className="flex flex-col">
                <span className="font-lexend font-bold text-[0.9em] uppercase tracking-wide text-gray-700">{title}</span>
                {subtitle && (
                    <span className="font-lexend text-[0.75em] text-gray-400">{subtitle}</span>
                )}
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey={xKey} tick={{ fontSize: 12, fontFamily: "Lexend" }} axisLine={{ stroke: "#d1d5db" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fontFamily: "Lexend" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "0.3em", fontFamily: "Lexend", fontSize: "0.8em" }} />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={3}
                        fill={`url(#${gradientId})`}
                        dot={{ r: 2.5, fill: color }}
                        activeDot={{ r: 4.5 }}
                        style={{ filter: `drop-shadow(0px 6px 4px ${color}59)` }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}