import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { formatWon } from '../../lib/gaseongbi/calc'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// 플랫폼별 매출 vs 순이익 그룹 바 차트
// platforms: [{ name, revenue, netProfit }]
export default function PlatformRevenueProfitChart({ platforms }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const labels = platforms.map((p) => p.name)
  const revenues = platforms.map((p) => p.revenue)
  const netProfits = platforms.map((p) => p.netProfit)

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '월 매출',
            data: revenues,
            backgroundColor: 'rgba(139,92,246,0.5)',
            borderRadius: 4,
            maxBarThickness: 40,
          },
          {
            label: '월 순이익',
            data: netProfits,
            backgroundColor: netProfits.map((v) => (v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)')),
            borderRadius: 4,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        layout: { padding: { top: 12, bottom: 4, left: 8, right: 8 } },
        scales: {
          y: {
            border: { display: false },
            ticks: {
              callback: (value) => formatWon(value),
              color: darkMode ? textColor.dark : textColor.light,
            },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          x: {
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
