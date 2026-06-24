import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

const PALETTE = ['rgba(139,92,246,1)', 'rgba(20,184,166,1)', 'rgba(59,130,246,1)', 'rgba(236,72,153,1)']

// 다중 라인 차트
// labels: string[], series: [{ label, data:number[], dashed? }]
// unit: y축/툴팁 접미사 (예: '%')
export default function MultiLineChart({ labels, series, unit = '', height = 'h-56' }) {
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
        labels,
        datasets: series.map((s, i) => ({
          label: s.label,
          data: s.data,
          borderColor: s.dashed ? 'rgba(148,163,184,0.9)' : PALETTE[i % PALETTE.length],
          backgroundColor: 'transparent',
          borderDash: s.dashed ? [4, 4] : [],
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        })),
      },
      options: {
        layout: { padding: { top: 8, bottom: 4 } },
        scales: {
          y: {
            border: { display: false },
            ticks: { callback: (v) => `${v}${unit}`, color: darkMode ? textColor.dark : textColor.light },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          x: { border: { display: false }, grid: { display: false }, ticks: { color: darkMode ? textColor.dark : textColor.light, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
        },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: darkMode ? textColor.dark : textColor.light, boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}${unit}` },
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
  }, [JSON.stringify(labels), JSON.stringify(series), unit])

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
    <div className={height}>
      <canvas ref={canvas}></canvas>
    </div>
  )
}
