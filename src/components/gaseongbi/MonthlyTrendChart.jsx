import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import {
  Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js'
import { formatWon, formatPercent } from '../../lib/gaseongbi/calc'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

// 월간 손익 추이 — netProfit(좌측 축) + marginRate(우측 축)
export default function MonthlyTrendChart({ snapshots }) {
  const canvas = useRef(null)
  const [chart, setChart] = useState(null)
  const { currentTheme } = useThemeProvider()
  const darkMode = currentTheme === 'dark'
  const { textColor, gridColor, tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors

  const labels = snapshots.map((s) => s.month)
  const netProfitData = snapshots.map((s) => s.netProfit)
  const marginRateData = snapshots.map((s) => s.marginRate * 100)

  useEffect(() => {
    const ctx = canvas.current
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '월 순이익',
            data: netProfitData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y',
            pointRadius: 3,
          },
          {
            label: '평균 마진율 (%)',
            data: marginRateData,
            borderColor: '#22c55e',
            backgroundColor: 'transparent',
            tension: 0.3,
            yAxisID: 'y1',
            pointRadius: 3,
          },
        ],
      },
      options: {
        layout: { padding: { top: 12, bottom: 4, left: 8, right: 8 } },
        scales: {
          y: {
            position: 'left',
            border: { display: false },
            ticks: {
              callback: (value) => formatWon(value),
              color: darkMode ? textColor.dark : textColor.light,
            },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          y1: {
            position: 'right',
            border: { display: false },
            ticks: {
              callback: (value) => `${value}%`,
              color: darkMode ? textColor.dark : textColor.light,
            },
            grid: { display: false },
          },
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: darkMode ? textColor.dark : textColor.light },
          },
        },
        plugins: {
          legend: { position: 'top', labels: { color: darkMode ? textColor.dark : textColor.light } },
          tooltip: {
            callbacks: {
              label: (context) =>
                context.dataset.yAxisID === 'y1' ? `${context.dataset.label}: ${formatPercent(context.parsed.y / 100)}` : `${context.dataset.label}: ${formatWon(context.parsed.y)}`,
            },
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
  }, [JSON.stringify(snapshots)])

  useEffect(() => {
    if (!chart) return
    chart.options.scales.x.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.ticks.color = darkMode ? textColor.dark : textColor.light
    chart.options.scales.y.grid.color = darkMode ? gridColor.dark : gridColor.light
    chart.options.scales.y1.ticks.color = darkMode ? textColor.dark : textColor.light
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
