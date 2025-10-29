import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Decimation,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Decimation)

export function PanelGraficas({ bloques }) {
  return (
    <div className="flex flex-col gap-3 h-full">
      {bloques.map((bloque) => (
        <div key={bloque.titulo} className="bg-white border border-slate-200 rounded-xl shadow-card p-3 flex flex-col" style={{ minHeight: '180px' }}>
          <h4 className="text-sm font-semibold text-slate-800">{bloque.titulo}</h4>
          <div className="mt-2 flex-1">
            <Line
              data={{
                datasets: bloque.series.map((serie) => ({
                  label: serie.etiqueta,
                  data: serie.datos,
                  borderColor: serie.color,
                  backgroundColor: `${serie.color}33`,
                  tension: 0,
                  pointRadius: 0,
                  borderWidth: 2,
                })),
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                parsing: false,
                plugins: {
                  legend: { display: bloque.series.length > 1 },
                  tooltip: { intersect: false, mode: 'index' },
                  decimation: { enabled: true, algorithm: 'min-max' },
                },
                scales: {
                  x: {
                    type: 'linear',
                    min: 0,
                    ticks: { color: '#475569' },
                    grid: { color: 'rgba(148,163,184,0.15)' },
                    title: { display: true, text: bloque.ejeX || 'Tiempo (s)', color: '#0f172a' },
                  },
                  y: {
                    ticks: { color: '#475569' },
                    grid: { color: 'rgba(148,163,184,0.15)' },
                    title: { display: true, text: bloque.ejeY, color: '#0f172a' },
                  },
                },
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
