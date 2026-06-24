import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// 앱별 접속 현황 (전체 / 오늘)
// rows: [{ label, total, today }]
export default function VisitBarChart({ rows }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.label),
        datasets: [
          { label: '전체', data: rows.map((r) => r.total), backgroundColor: 'rgba(139,92,246,0.6)', borderRadius: 4, maxBarThickness: 32 },
          { label: '오늘', data: rows.map((r) => r.today), backgroundColor: 'rgba(20,184,166,0.7)', borderRadius: 4, maxBarThickness: 32 },
        ],
      },
      options: {
        layout: { padding: { top: 12, bottom: 4 } },
        scales: {
          y: {
            beginAtZero: true,
            border: { display: false },
            ticks: { precision: 0, callback: (v) => `${v.toLocaleString('ko-KR')}`, color: darkMode ? textColor.dark : textColor.light },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          x: { border: { display: false }, grid: { display: false }, ticks: { color: darkMode ? textColor.dark : textColor.light } },
        },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: darkMode ? textColor.dark : textColor.light, boxWidth: 12 } },
          tooltip: {
            callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toLocaleString('ko-KR')}회` },
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
  }, [JSON.stringify(rows)])

  useEffect(() => {
    if (!chart) return
    chart.options.scales.x.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.grid.color = darkMode ? gridColor.dark : gridColor.light
    chart.options.plugins.legend.labels.color = darkMode ? textColor.dark : textColor.light
    chart.update('none')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme])

  return (
    <div className="h-64">
      <canvas ref={canvas}></canvas>
    </div>
  )
}
