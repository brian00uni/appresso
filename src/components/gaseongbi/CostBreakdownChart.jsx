import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { formatWon } from '../../lib/gaseongbi/calc'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const SEGMENTS = [
  { key: 'commission', label: '중개수수료', color: 'rgba(139,92,246,0.6)' },
  { key: 'cardFee', label: '카드수수료', color: 'rgba(59,130,246,0.6)' },
  { key: 'delivery', label: '배달비', color: 'rgba(234,179,8,0.6)' },
  { key: 'coupon', label: '쿠폰', color: 'rgba(249,115,22,0.6)' },
  { key: 'ad', label: '광고비', color: 'rgba(239,68,68,0.6)' },
]

// 플랫폼별 비용 구성 스택 바 차트
// platforms: [{ name, commission, cardFee, delivery, coupon, ad }]
export default function CostBreakdownChart({ platforms }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const labels = platforms.map((p) => p.name)

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: SEGMENTS.map((seg) => ({
          label: seg.label,
          data: platforms.map((p) => p[seg.key] || 0),
          backgroundColor: seg.color,
          borderRadius: 4,
          stack: 'cost',
          maxBarThickness: 64,
        })),
      },
      options: {
        layout: { padding: { top: 12, bottom: 4, left: 8, right: 8 } },
        scales: {
          y: {
            stacked: true,
            border: { display: false },
            ticks: {
              callback: (value) => formatWon(value),
              color: darkMode ? textColor.dark : textColor.light,
            },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          x: {
            stacked: true,
            border: { display: false },
            grid: { display: false },
            ticks: { color: darkMode ? textColor.dark : textColor.light },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: darkMode ? textColor.dark : textColor.light, boxWidth: 12 },
          },
          tooltip: {
            callbacks: { label: (context) => `${context.dataset.label}: ${formatWon(context.parsed.y)}` },
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
  }, [JSON.stringify(platforms)])

  useEffect(() => {
    if (!chart) return
    chart.options.scales.x.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.grid.color = darkMode ? gridColor.dark : gridColor.light
    chart.options.plugins.legend.labels.color = darkMode ? textColor.dark : textColor.light
    chart.options.plugins.tooltip.bodyColor = darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light
    chart.options.plugins.tooltip.backgroundColor = darkMode ? tooltipBgColor.dark : tooltipBgColor.light
    chart.options.plugins.tooltip.borderColor = darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light
    chart.update('none')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme])

  return (
    <div className="h-64">
      <canvas ref={canvas}></canvas>
    </div>
  )
}
