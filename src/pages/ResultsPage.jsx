import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function ResultsPage() {
  const nav = useNavigate()
  const { state } = useLocation()
  const raw = state?.result ?? state ?? null

  const normalizarLista = (data) => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return Object.entries(data).map(([etiqueta, valor]) => ({
      etiqueta,
      valor,
    }))
  }

  const metricas = normalizarLista(state?.metricas ?? raw?.metricas ?? null)
  const resumen = normalizarLista(state?.resumen ?? raw?.resumen ?? null)
  const graficas = Array.isArray(state?.graficas ?? raw?.graficas) ? (state?.graficas ?? raw?.graficas) : []
  const notas = state?.notas ?? raw?.notas ?? raw?.comentarios ?? ''

  return (
    <div className="max-w-[1280px] mx-auto px-4">
      <header className="header-bar rounded-b-xl">
        <h2 className="header-title">Resultados</h2>
      </header>

      <section className="mt-4 grid gap-4">
        <div className="card p-4 text-sm text-slate-700">
          <p className="m-0">
            Las simulaciones muestran sus métricas y gráficas dentro de cada escenario.
            Si necesitas revisar un resultado específico, utiliza el resumen rápido que aparece a continuación
            o vuelve al nivel para repetir la actividad.
          </p>
        </div>

        {resumen.length > 0 && (
          <div className="panel-mint p-4">
            <h3 className="text-slate-800 font-semibold text-base mb-3">Resumen</h3>
            <ul className="text-sm text-slate-700 grid gap-2">
              {resumen.map(({ etiqueta, valor }) => (
                <li key={etiqueta} className="flex justify-between">
                  <span>{etiqueta}</span>
                  <span className="font-semibold text-slate-900">{formatearValor(valor)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {metricas.length > 0 && (
          <div className="card p-4">
            <h3 className="text-slate-800 font-semibold text-base mb-3">Métricas registradas</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 text-sm">
              {metricas.map(({ etiqueta, valor }) => (
                <div key={etiqueta} className="panel-mint px-3 py-2">
                  <p className="text-slate-500 m-0 text-xs uppercase tracking-wide">{etiqueta}</p>
                  <p className="text-slate-900 m-0 font-semibold">{formatearValor(valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {graficas.length > 0 && (
          <div className="card p-4">
            <h3 className="text-slate-800 font-semibold text-base mb-3">Gráficas calculadas</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {graficas.map((grafica, idx) => (
                <li key={grafica?.id ?? idx}>
                  {grafica?.titulo ?? grafica?.id ?? `Grafica ${idx + 1}`}
                  {Array.isArray(grafica?.datos) && (
                    <span className="text-slate-500"> — {grafica.datos.length} puntos</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {notas && (
          <div className="panel-mint p-4 text-sm text-slate-700">
            <h3 className="text-slate-800 font-semibold text-base mb-2">Notas</h3>
            <p className="m-0 whitespace-pre-wrap">{notas}</p>
          </div>
        )}

        {raw && (
          <details className="card p-4 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-800">Ver datos originales</summary>
            <pre className="mt-3 bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </details>
        )}
      </section>

      <section className="mt-4 flex justify-end gap-2">
        <button className="btn btn-purple" onClick={() => nav('/niveles/1')}>Reintentar</button>
        <button className="btn btn-outline" onClick={() => nav('/niveles')}>Volver al menú</button>
      </section>
    </div>
  )
}

function formatearValor(valor) {
  if (valor == null) return '—'
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return String(valor)
    if (Math.abs(valor) >= 1000) return valor.toFixed(0)
    if (Math.abs(valor) >= 1) return valor.toFixed(2)
    return valor.toPrecision(3)
  }
  return String(valor)
}
