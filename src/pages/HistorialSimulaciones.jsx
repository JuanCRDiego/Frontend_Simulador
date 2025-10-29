import React, { useEffect, useMemo, useState } from 'react'
import { obtenerHistorialSimulaciones } from '../servicios/ServicioSimulaciones.js'
import { Niveles } from '../domain/contenido/Niveles.js'

export default function HistorialSimulaciones() {
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true)
        const datos = await obtenerHistorialSimulaciones()
        setHistorial(Array.isArray(datos) ? datos : [])
      } catch (err) {
        const mensaje = err?.datos?.mensaje || err?.message || 'No se pudo obtener el historial.'
        setError(mensaje)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const registrosEnriquecidos = useMemo(() => historial.map((registro) => {
    const nivel = Niveles.findById(registro.nivelId)
    return {
      ...registro,
      nivelNombre: nivel?.nombre ?? `Nivel ${registro.nivelId}`,
      nivelNumero: nivel?.numero ?? registro.nivelId,
    }
  }), [historial])

  return (
    <section className="grid gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold">Historial de simulaciones</h2>
        <p className="text-sm text-slate-600 m-0">
          Revisa los resultados que se han guardado después de ejecutar las simulaciones. Cada registro incluye
          la tabla resumen y los parámetros utilizados.
        </p>
      </div>

      {cargando && (
        <div className="panel-mint px-4 py-6 text-center text-slate-600">
          Cargando historial...
        </div>
      )}

      {error && (
        <div className="panel-mint px-4 py-3 text-rose-600">
          {error}
        </div>
      )}

      {!cargando && !error && registrosEnriquecidos.length === 0 && (
        <div className="panel-mint px-4 py-6 text-center text-slate-600">
          No hay simulaciones guardadas todavía.
        </div>
      )}

      {registrosEnriquecidos.map((registro) => (
        <article key={registro.id} className="card grid gap-3">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {registro.nivelNombre}
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Nivel {registro.nivelNumero} · {registro.tipoSimulacion}
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {formatearFecha(registro.creadoEn)}
            </span>
          </header>

          {renderTablaResumen(registro.resumen?.resumenDominio?.tabla, registro.resumen?.metricasTiempoReal)}

          {renderMetricas(registro.resumen?.metricasTiempoReal)}

          {renderParametros(registro.parametros)}
        </article>
      ))}
    </section>
  )
}

function renderTablaResumen(tabla, metricasTiempoReal) {
  const columnas = tabla?.columnas
  const filas = tabla?.filas
  if (Array.isArray(columnas) && columnas.length > 0 && Array.isArray(filas) && filas.length > 0) {
    return (
      <div className="overflow-x-auto">
        <table className="tabla-resumen">
          <thead>
            <tr>
              {columnas.map((col, idx) => <th key={idx}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, idx) => (
              <tr key={idx}>
                {(Array.isArray(fila) ? fila : [fila]).map((celda, celIdx) => (
                  <td key={celIdx}>{formatearValor(celda)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (Array.isArray(metricasTiempoReal) && metricasTiempoReal.length > 0) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        {metricasTiempoReal.map((metrica) => (
          <div key={metrica.id ?? metrica.nombre} className="panel-mint px-3 py-2">
            <p className="text-xs text-slate-500 m-0 uppercase tracking-wide">{metrica.nombre ?? metrica.id}</p>
            <p className="text-slate-900 m-0 font-semibold">{formatearValor(metrica.valor)} {metrica.unidad || ''}</p>
          </div>
        ))}
      </div>
    )
  }

  return null
}

function renderMetricas(metricas) {
  if (!Array.isArray(metricas) || metricas.length === 0) return null
  return (
    <details className="panel-mint px-4 py-3 text-sm text-slate-700">
      <summary className="cursor-pointer font-semibold text-slate-800">Ver métricas en detalle</summary>
      <ul className="mt-2 grid gap-1">
        {metricas.map((metrica) => (
          <li key={metrica.id ?? metrica.nombre} className="flex justify-between text-xs">
            <span>{metrica.nombre ?? metrica.id}</span>
            <span className="font-semibold text-slate-900">{formatearValor(metrica.valor)} {metrica.unidad || ''}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function renderParametros(parametros) {
  if (!parametros || typeof parametros !== 'object') return null
  const pares = Object.entries(parametros)
  if (pares.length === 0) return null
  return (
    <details className="panel-mint px-4 py-3 text-sm text-slate-700">
      <summary className="cursor-pointer font-semibold text-slate-800">Ver parámetros utilizados</summary>
      <ul className="mt-2 grid gap-1">
        {pares.map(([clave, valor]) => (
          <li key={clave} className="flex justify-between text-xs">
            <span>{clave}</span>
            <span className="font-semibold text-slate-900">{formatearValor(valor)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function formatearValor(valor) {
  if (valor == null) return '—'
  if (typeof valor === 'number') {
    return formatearNumero(valor)
  }
  if (typeof valor === 'string') {
    const numero = Number(valor)
    if (!Number.isNaN(numero)) {
      return formatearNumero(numero)
    }
  }
  if (typeof valor === 'object') {
    return JSON.stringify(valor)
  }
  return String(valor)
}

function formatearNumero(valor) {
  if (!Number.isFinite(valor)) return String(valor)
  if (Math.abs(valor) >= 1000) return valor.toFixed(0)
  if (Math.abs(valor) >= 1) return valor.toFixed(2)
  return valor.toPrecision(3)
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha desconocida'
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return fecha
  // Formatear la fecha usando la zona horaria del usuario pero con formato específico
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota'  // Zona horaria de Colombia
  })
}
