import React, { useRef, useEffect, useState } from 'react'
import { useThemeProvider } from '../../utils/ThemeContext'
import { chartColors } from '../../charts/ChartjsConfig'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// 플랫폼별 광고비/광고매출/광고순이익 그룹 막대 (단위: 만원)
// rows: [{ name, adCost, adRevenue, adProfit }] (만원 단위 숫자)
export default function AdPerformanceChart({ rows }) {
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
        labels: rows.map((r) => r.name),
        datasets: [
          { label: '광고비', data: rows.map((r) => r.adCost), backgroundColor: 'rgba(139,92,246,0.6)', borderRadius: 4, maxBarThickness: 26 },
          { label: '광고매출', data: rows.map((r) => r.adRevenue), backgroundColor: 'rgba(20,184,166,0.6)', borderRadius: 4, maxBarThickness: 26 },
          { label: '광고순이익', data: rows.map((r) => r.adProfit), backgroundColor: 'rgba(245,158,11,0.7)', borderRadius: 4, maxBarThickness: 26 },
        ],
      },
      options: {
        layout: { padding: { top: 12, bottom: 4 } },
        scales: {
          y: {
            border: { display: false },
            ticks: { callback: (v) => `${v.toLocaleString('ko-KR')}`, color: darkMode ? textColor.dark : textColor.light },
            grid: { color: darkMode ? gridColor.dark : gridColor.light },
          },
          x: { border: { display: false }, grid: { display: false }, ticks: { color: darkMode ? textColor.dark : textColor.light } },
        },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: darkMode ? textColor.dark : textColor.light, boxWidth: 12 } },
          tooltip: {
            callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toLocaleString('ko-KR')}만원` },
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
