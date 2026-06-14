import React, { useRef, useEffect } from 'react'
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const LINE_COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#34d399', '#f472b6', '#60a5fa']

export default function NaverTrendChart({ results, height = 280 }) {
  const canvas = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvas.current || !results?.length) return

    const labels = results[0]?.data?.map((d) => d.period) ?? []
    const datasets = results.map((group, i) => {
      const color = LINE_COLORS[i % LINE_COLORS.length]
      return {
        label: group.title,
        data: group.data?.map((d) => d.ratio) ?? [],
        borderColor: color,
        backgroundColor: color,
        pointRadius: 2,
        tension: 0.3,
        fill: false,
      }
    })

    chartRef.current = new Chart(canvas.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        maintainAspectRatio: false,
        resizeDelay: 200,
        scales: {
          x: {
            ticks: { color: '#9ca3af', maxRotation: 0, autoSkip: true },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#d1d5db', boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [results])

  return (
    <div style={{ height }}>
      <canvas ref={canvas}></canvas>
    </div>
  )
}
