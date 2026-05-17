"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

type MonthlyChartProps = {
  data: { label: string; count: number; value: number }[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; value: number }; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-medium">{payload[0].payload.label}</p>
        <p className="text-slate-300">{payload[0].value} quotes</p>
        <p className="text-emerald-400">₹{(payload[0].payload.value / 1000).toFixed(1)}k</p>
      </div>
    )
  }
  return null
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartPrimary = "#4f46e5"
  const chartSecondary = "#c7d2fe"

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Monthly Activity</h3>
      <p className="text-xs text-slate-500 mb-4">Quotes created over the last 6 months</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? chartPrimary : chartSecondary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
