import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import {
  Chart, RadarController, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend,
} from 'chart.js'

Chart.register(RadarController, PointElement, LineElement, RadialLinearScale, Filler, Tooltip, Legend)

const SERIES_COLORS = [
  { border: 'rgba(139,92,246,1)', background: 'rgba(139,92,246,0.2)' },
  { border: 'rgba(59,130,246,1)', background: 'rgba(59,130,246,0.15)' },
  { border: 'rgba(234,179,8,1)', background: 'rgba(234,179,8,0.12)' },
]

// 주요 지표 비교 레이더 차트
// labels: [string], series: [{ label, data: number[] }] (0~100 정규화 점수)
export default function BenchmarkRadarChart({ labels, series }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { textColor, gridColor } = chartColors

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: series.map((s, i) => ({
          label: s.label,
          data: s.data,
          borderColor: SERIES_COLORS[i % SERIES_COLORS.length].border,
          backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length].background,
          pointBackgroundColor: SERIES_COLORS[i % SERIES_COLORS.length].border,
          borderWidth: 2,
        })),
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
            angleLines: { color: darkMode ? gridColor.dark : gridColor.light },
            pointLabels: { color: darkMode ? textColor.dark : textColor.light, font: { size: 11 } },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: darkMode ? textColor.dark : textColor.light, boxWidth: 12 },
          },
        },
        maintainAspectRatio: false,
      },
    })
    setChart(newChart)
    return () => newChart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(labels), JSON.stringify(series)])

  useEffect(() => {
    if (!chart) return
    chart.options.scales.r.grid.color = darkMode ? gridColor.dark : gridColor.light
    chart.options.scales.r.angleLines.color = darkMode ? gridColor.dark : gridColor.light
    chart.options.scales.r.pointLabels.color = darkMode ? textColor.dark : textColor.light
    chart.options.plugins.legend.labels.color = darkMode ? textColor.dark : textColor.light
    chart.update('none')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme])

  return (
    <div className="h-80">
      <canvas ref={canvas}></canvas>
    </div>
  )
}
