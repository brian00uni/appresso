import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler)

// 일자별 전체 방문 추이
// points: [{ day: 'YYYY-MM-DD', total }]
export default function VisitTrendChart({ points }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map((p) => p.day.slice(5)), // MM-DD
        datasets: [
          {
            label: '방문',
            data: points.map((p) => p.total),
            borderColor: 'rgba(139,92,246,1)',
            backgroundColor: 'rgba(139,92,246,0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(139,92,246,1)',
          },
        ],
      },
      options: {
        layout: { padding: { top: 12, bottom: 4 } },
        scales: {
          y: {
            beginAtZero: true,
            border: { display: false },
            ticks: { precision: 0, color: darkMode ? textColor.dark : textColor.light },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          x: { border: { display: false }, grid: { display: false }, ticks: { color: darkMode ? textColor.dark : textColor.light } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => `${c.parsed.y.toLocaleString('ko-KR')}회` },
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
  }, [JSON.stringify(points)])

  useEffect(() => {
    if (!chart) return
    chart.options.scales.x.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.grid.color = darkMode ? gridColor.dark : gridColor.light
    chart.update('none')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme])

  return (
    <div className="h-64">
      <canvas ref={canvas}></canvas>
    </div>
  )
}
