"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { stroke: "#71717a", fontSize: 11, tickLine: false, axisLine: false } as const;
const GRID = <CartesianGrid stroke="#232327" strokeDasharray="0" vertical={false} />;
const LINE = "#c6ff3d";
const BAR = "#9be000";

function Tip({ active, payload, label, unit, fmt }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string; fmt?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-raised px-3 py-2 text-xs shadow-xl">
      <p className="text-mute">{fmt ? fmt(String(label)) : label}</p>
      <p className="mt-0.5 font-semibold tabular text-fg">{payload[0].value}{unit}</p>
    </div>
  );
}
const short = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : d);

export function TrendLine({ data, unit, target, targetLabel, domainPad = 1 }: { data: { date: string; value: number }[]; unit: string; target?: number; targetLabel?: string; domainPad?: number }) {
  const vals = data.map((d) => d.value).concat(target !== undefined ? [target] : []);
  const min = Math.floor(Math.min(...vals) - domainPad), max = Math.ceil(Math.max(...vals) + domainPad);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        {GRID}
        <XAxis dataKey="date" tickFormatter={short} {...AXIS} minTickGap={24} />
        <YAxis domain={[min, max]} {...AXIS} width={44} />
        {target !== undefined && <ReferenceLine y={target} stroke="#a1a1aa" strokeDasharray="4 4" label={{ value: targetLabel ?? "Target", fill: "#a1a1aa", fontSize: 11, position: "insideTopRight" }} />}
        <Tooltip content={<Tip unit={unit} fmt={short} />} cursor={{ stroke: "#3a3a42" }} />
        <Line type="monotone" dataKey="value" stroke={LINE} strokeWidth={2} dot={{ r: 4, fill: LINE, stroke: "#111113", strokeWidth: 2 }} activeDot={{ r: 6, stroke: "#111113", strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, unit, target, targetLabel, xFmt = "date" }: { data: { label: string; value: number }[]; unit: string; target?: number; targetLabel?: string; xFmt?: "date" | "raw" }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }} barCategoryGap={4}>
        {GRID}
        <XAxis dataKey="label" tickFormatter={xFmt === "date" ? short : undefined} {...AXIS} minTickGap={16} />
        <YAxis {...AXIS} width={44} allowDecimals={false} domain={[0, (max: number) => Math.ceil(Math.max(max, target ?? 0) * 1.1)]} />
        <Tooltip content={<Tip unit={unit} fmt={xFmt === "date" ? short : undefined} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        {target !== undefined && <ReferenceLine y={target} stroke="#a1a1aa" strokeDasharray="4 4" label={{ value: targetLabel ?? "Target", fill: "#a1a1aa", fontSize: 11, position: "insideTopRight" }} />}
        <Bar dataKey="value" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
