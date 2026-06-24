import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip)

// 마진율 분포 도넛 + 우측 커스텀 범례
// buckets: [{ label, count, color }]
export default function MarginDistributionChart({ buckets }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const total = buckets.reduce((sum, b) => sum + b.count, 0)

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: buckets.map((b) => b.label),
        datasets: [
          {
            data: buckets.map((b) => b.count),
            backgroundColor: buckets.map((b) => b.color),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: '68%',
        layout: { padding: 8 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => `${c.label}: ${c.parsed}개` },
            bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
            backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
            borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
          },
        },
        maintainAspectRatio: false,
      },
    })
    setChart(newChart)
    return () => newChart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(buckets)])

  useEffect(() => {
    if (!chart) return
    chart.options.plugins.tooltip.bodyColor = darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light
    chart.options.plugins.tooltip.backgroundColor = darkMode ? tooltipBgColor.dark : tooltipBgColor.light
    chart.options.plugins.tooltip.borderColor = darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light
    chart.update('none')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme])

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-36 h-36 flex-none">
        <canvas ref={canvas}></canvas>
      </div>
      <ul className="flex-1 space-y-2">
        {buckets.map((b) => {
          const pct = total > 0 ? ((b.count / total) * 100).toFixed(1) : '0.0'
          return (
            <li key={b.label} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ backgroundColor: b.color }} />
              <span className="text-gray-600 dark:text-gray-300 flex-1">{b.label}</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">
                {b.count}개 <span className="text-gray-400 dark:text-gray-500">({pct}%)</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
