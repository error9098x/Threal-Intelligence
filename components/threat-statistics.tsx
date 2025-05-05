"use client"

import type { ThreatStats } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ThreatStatisticsProps {
  stats: ThreatStats
}

export default function ThreatStatistics({ stats }: ThreatStatisticsProps) {
  // Prepare data for charts
  const countryData = Object.entries(stats.countryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 countries

  const malwareData = Object.entries(stats.malwareCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 malware types

  const confidenceData = [
    { name: "High", value: stats.confidenceLevels.high },
    { name: "Medium", value: stats.confidenceLevels.medium },
    { name: "Low", value: stats.confidenceLevels.low },
  ]

  const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-800/20">
        <h4 className="text-blue-100 font-medium mb-2">Total Threats: {stats.totalThreats}</h4>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-blue-900/20 p-2 rounded">
            <div className="text-xs text-blue-300">High Confidence</div>
            <div className="text-lg font-semibold text-red-400">{stats.confidenceLevels.high}</div>
          </div>
          <div className="bg-blue-900/20 p-2 rounded">
            <div className="text-xs text-blue-300">Medium Confidence</div>
            <div className="text-lg font-semibold text-amber-400">{stats.confidenceLevels.medium}</div>
          </div>
          <div className="bg-blue-900/20 p-2 rounded">
            <div className="text-xs text-blue-300">Low Confidence</div>
            <div className="text-lg font-semibold text-blue-400">{stats.confidenceLevels.low}</div>
          </div>
        </div>

        <h4 className="text-blue-100 font-medium mb-2">Confidence Distribution</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={confidenceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : index === 1 ? "#f59e0b" : "#3b82f6"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} threats`, "Count"]}
                contentStyle={{ backgroundColor: "#1e3a8a", borderColor: "#1e40af", color: "#bfdbfe" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-800/20">
        <h4 className="text-blue-100 font-medium mb-2">Threats Over Time (7 Days)</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.timeDistribution}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#93c5fd", fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis tick={{ fill: "#93c5fd", fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} threats`, "Count"]}
                labelFormatter={(label) => {
                  const date = new Date(label)
                  return date.toLocaleDateString()
                }}
                contentStyle={{ backgroundColor: "#1e3a8a", borderColor: "#1e40af", color: "#bfdbfe" }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-800/20">
        <h4 className="text-blue-100 font-medium mb-2">Top Countries</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#93c5fd", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#93c5fd", fontSize: 12 }} width={40} />
              <Tooltip
                formatter={(value) => [`${value} threats`, "Count"]}
                contentStyle={{ backgroundColor: "#1e3a8a", borderColor: "#1e40af", color: "#bfdbfe" }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-800/20">
        <h4 className="text-blue-100 font-medium mb-2">Top Malware Types</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={malwareData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  name.length > 10
                    ? `${name.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`
                    : `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {malwareData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} threats`, name]}
                contentStyle={{ backgroundColor: "#1e3a8a", borderColor: "#1e40af", color: "#bfdbfe" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
