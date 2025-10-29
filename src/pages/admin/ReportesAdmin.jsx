import React, { useCallback, useEffect, useState } from 'react'
import {
  obtenerReporteEstudiantes,
  obtenerResumenSimulaciones,
  obtenerHistorialEstudiante,
} from '../../servicios/ServicioReportes.js'
import { listarNiveles } from '../../servicios/ServicioNiveles.js'
import { eliminarResultadoSimulacion, obtenerHistorialSimulaciones } from '../../servicios/ServicioSimulaciones.js'
import { Niveles as NivelesDomain } from '../../domain/contenido/Niveles.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ReportesAdmin() {
  const [estudiantes, setEstudiantes] = useState([])
  const [resumen, setResumen] = useState([])
  const [historialSeleccionado, setHistorialSeleccionado] = useState({ estudiante: null, datos: [] })
  const [nivelesCatalogo, setNivelesCatalogo] = useState([])
  const [misSimulaciones, setMisSimulaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const { usuario } = useAuth()

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')
      const [usuarios, resumenSim, niveles] = await Promise.all([
        obtenerReporteEstudiantes(),
        obtenerResumenSimulaciones(),
        listarNiveles(),
      ])
      setEstudiantes(usuarios)
      setResumen(resumenSim)
      setNivelesCatalogo(normalizarNiveles(niveles))
      if (usuario && usuario.rol !== 'ADMIN') {
        const propias = await obtenerHistorialSimulaciones({ usuarioId: usuario.id })
        setMisSimulaciones(propias)
      } else {
        setMisSimulaciones([])
      }
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudieron obtener los reportes.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (usuario) {
      cargarDatos()
    }
  }, [usuario])

  const manejarVerHistorial = useCallback(async (estudiante) => {
    try {
      const datos = await obtenerHistorialEstudiante(estudiante.id)
      setHistorialSeleccionado({ estudiante, datos })
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo cargar el historial del estudiante.')
    }
  }, [setHistorialSeleccionado, setError])

  const cerrarHistorial = () => setHistorialSeleccionado({ estudiante: null, datos: [] })

  const manejarEliminarResultado = useCallback(async (resultadoId) => {
    if (!resultadoId) return
    const confirmar = window.confirm('¿Eliminar este registro de simulación?')
    if (!confirmar) return
    try {
      await eliminarResultadoSimulacion(resultadoId)
      setMisSimulaciones((prev) => prev.filter((item) => item.id !== resultadoId))
      if (historialSeleccionado.estudiante) {
        const datosActualizados = historialSeleccionado.datos.filter((item) => item.id !== resultadoId)
        setHistorialSeleccionado((prev) => ({ ...prev, datos: datosActualizados }))
      }
      await cargarDatos()
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo eliminar el registro.')
    }
  }, [historialSeleccionado])

  const totalEstudiantes = estudiantes.length
  const totalSimulaciones = resumen.reduce((acum, fila) => acum + (Number(fila?.cantidad) || 0), 0)
  const totalHistorial = historialSeleccionado.datos.length

  return (
    <section className="grid gap-4">
      <header className="card">
        <h2 className="text-lg font-semibold text-slate-800">Reportes</h2>
        <p className="text-sm text-slate-600 m-0">
          Revisa estudiantes registrados, el resumen general de simulaciones y el historial individual de cada estudiante.
        </p>
      </header>

      {error && (
        <div className="panel-mint px-4 py-3 text-rose-600">
          {error}
        </div>
      )}

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800">Estudiantes registrados</h3>
          {!cargando && totalEstudiantes > 0 && (
            <span className="resumen-tag">Total {totalEstudiantes}</span>
          )}
        </div>
        {cargando ? (
          <p className="text-sm text-slate-600">Cargando...</p>
        ) : estudiantes.length === 0 ? (
          <p className="text-sm text-slate-600">No hay estudiantes registrados.</p>
        ) : (
          <div className="tabla-wrapper overflow-x-auto">
            <table className="tabla-resumen">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est) => {
                  const fechaRegistro = formatearFecha(est.creadoEn)
                  return (
                    <tr key={est.id}>
                      <td>
                        <div className="dato-principal">{est.nombre || '—'}</div>
                        {est.id && <div className="dato-secundario">ID: {est.id}</div>}
                      </td>
                      <td>
                        <span className="font-mono text-sm text-slate-600" title={est.correo || 'Sin correo'}>
                          {est.correo || '—'}
                        </span>
                      </td>
                      <td>{renderEstadoBadge(est.estado)}</td>
                      <td>
                        <span className="text-sm text-slate-600 whitespace-nowrap" title={fechaRegistro}>
                          {fechaRegistro}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => manejarVerHistorial(est)}
                        >
                          Ver historial
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {usuario && usuario.rol !== 'ADMIN' && (
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-800">Mis simulaciones ({usuario.rol})</h3>
            {misSimulaciones.length > 0 && (
              <span className="resumen-tag">Total {misSimulaciones.length}</span>
            )}
          </div>
          {misSimulaciones.length === 0 ? (
            <p className="text-sm text-slate-600">Aún no has registrado ejecuciones.</p>
          ) : (
            <div className="tabla-wrapper overflow-x-auto">
              <table className="tabla-resumen">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Nivel</th>
                    <th>Tipo</th>
                    <th>Resumen</th>
                    <th>Parámetros</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {misSimulaciones.map((item) => {
                    const fecha = formatearFecha(item.creadoEn)
                    const nivelNombre = obtenerNombreNivel(nivelesCatalogo, item.nivelId)
                    const resumenTexto = renderResumenCorto(item.resumen)
                    const parametrosTexto = renderParametrosCortos(item.parametros)
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className="text-sm text-slate-600 whitespace-nowrap" title={fecha}>
                            {fecha}
                          </span>
                        </td>
                        <td>
                          <div className="dato-principal">{nivelNombre}</div>
                          <div className="dato-secundario">ID: {item.nivelId}</div>
                        </td>
                        <td className="capitalize text-slate-600">{item.tipoSimulacion}</td>
                        <td title={resumenTexto}>
                          <span className="inline-block max-w-xs whitespace-pre-wrap text-sm text-slate-600 leading-snug">
                            {resumenTexto}
                          </span>
                        </td>
                        <td title={parametrosTexto}>
                          <span className="inline-block max-w-xs whitespace-pre-wrap text-sm text-slate-600 leading-snug">
                            {parametrosTexto}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => manejarEliminarResultado(item.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800">Simulaciones registradas</h3>
          {!cargando && totalSimulaciones > 0 && (
            <span className="resumen-tag">Total {totalSimulaciones}</span>
          )}
        </div>
        {cargando ? (
          <p className="text-sm text-slate-600">Cargando...</p>
        ) : resumen.length === 0 ? (
          <p className="text-sm text-slate-600">No se encontraron simulaciones en el rango indicado.</p>
        ) : (
          <div className="tabla-wrapper overflow-x-auto">
            <table className="tabla-resumen">
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Tipo de simulación</th>
                  <th className="text-center">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((fila, idx) => {
                  const nivelNombre = obtenerNombreNivel(nivelesCatalogo, fila.nivelId)
                  const cantidad = Number(fila.cantidad) || 0
                  return (
                    <tr key={`${fila.nivelId}-${fila.tipoSimulacion}-${idx}`}>
                      <td>
                        <div className="dato-principal">{nivelNombre}</div>
                        <div className="dato-secundario">ID: {fila.nivelId}</div>
                      </td>
                      <td className="text-slate-600">{fila.tipoSimulacion}</td>
                      <td className="text-center font-semibold text-slate-800">{cantidad}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {historialSeleccionado.estudiante && (
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Historial de {historialSeleccionado.estudiante.nombre}
              </h3>
              <p className="text-xs text-slate-500 m-0">Correo: {historialSeleccionado.estudiante.correo}</p>
            </div>
            <div className="flex items-center gap-2">
              {totalHistorial > 0 && <span className="resumen-tag">Registros {totalHistorial}</span>}
              <button className="btn btn-outline btn-xs" onClick={cerrarHistorial}>
                Cerrar
              </button>
            </div>
          </div>
          {historialSeleccionado.datos.length === 0 ? (
            <p className="text-sm text-slate-600 mt-2">El estudiante aún no registra simulaciones.</p>
          ) : (
            <div className="tabla-wrapper overflow-x-auto">
              <table className="tabla-resumen">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Nivel</th>
                    <th>Tipo</th>
                    <th>Resumen</th>
                    <th>Parámetros</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historialSeleccionado.datos.map((item) => {
                    const fecha = formatearFecha(item.creadoEn)
                    const nivelNombre = obtenerNombreNivel(nivelesCatalogo, item.nivelId)
                    const resumenTexto = renderResumenCorto(item.resumen)
                    const parametrosTexto = renderParametrosCortos(item.parametros)
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className="text-sm text-slate-600 whitespace-nowrap" title={fecha}>
                            {fecha}
                          </span>
                        </td>
                        <td>
                          <div className="dato-principal">{nivelNombre}</div>
                          <div className="dato-secundario">ID: {item.nivelId}</div>
                        </td>
                        <td className="capitalize text-slate-600">{item.tipoSimulacion}</td>
                        <td title={resumenTexto}>
                          <span className="inline-block max-w-xs whitespace-pre-wrap text-sm text-slate-600 leading-snug">
                            {resumenTexto}
                          </span>
                        </td>
                        <td title={parametrosTexto}>
                          <span className="inline-block max-w-xs whitespace-pre-wrap text-sm text-slate-600 leading-snug">
                            {parametrosTexto}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => manejarEliminarResultado(item.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  )
}

function renderEstadoBadge(estado) {
  const valor = (estado ?? '').toString().trim()
  if (!valor) {
    return <span className="estado-pill bg-slate-100 text-slate-500 border-slate-200">Sin estado</span>
  }

  const lower = valor.toLowerCase()
  if (lower.includes('activo') || lower.includes('habilitado')) {
    return <span className="estado-pill bg-emerald-100 text-emerald-700 border-emerald-200">{valor}</span>
  }

  if (lower.includes('pendiente') || lower.includes('espera')) {
    return <span className="estado-pill bg-amber-100 text-amber-700 border-amber-200">{valor}</span>
  }

  if (lower.includes('inactivo') || lower.includes('suspend') || lower.includes('bloque')) {
    return <span className="estado-pill bg-rose-100 text-rose-700 border-rose-200">{valor}</span>
  }

  return <span className="estado-pill bg-slate-100 text-slate-600 border-slate-200">{valor}</span>
}

function formatearFecha(valor) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleString()
}

function normalizarNiveles(niveles) {
  if (!Array.isArray(niveles) || niveles.length === 0) {
    return NivelesDomain.list().map((n) => ({ id: String(n.id), nombre: `Nivel ${n.numero}: ${n.nombre}` }))
  }
  return niveles.map((nivel) => ({
    id: String(nivel.id),
    nombre: `Nivel ${nivel.numero}: ${nivel.nombre}`,
  }))
}

function obtenerNombreNivel(niveles, nivelId) {
  const buscado = niveles.find((nivel) => String(nivel.id) === String(nivelId))
  return buscado ? buscado.nombre : `Nivel ${nivelId}`
}

function renderResumenCorto(resumen) {
  if (!resumen) return '—'
  const metricas = resumen.metricasTiempoReal || []
  const tabla = resumen.resumenDominio?.tabla
  if (tabla && Array.isArray(tabla.filas) && tabla.filas.length > 0) {
    return `Filas: ${tabla.filas.length}`
  }
  if (metricas.length > 0) {
    return metricas.slice(0, 2).map((m) => `${m.nombre || m.id}: ${formatearNumero(m.valor)}`).join(', ')
  }
  return 'Sin datos'
}

function renderParametrosCortos(parametros) {
  if (!parametros || typeof parametros !== 'object') return '—'
  const entradas = Object.entries(parametros)
  if (entradas.length === 0) return '—'
  return entradas.slice(0, 3).map(([clave, valor]) => `${clave}: ${formatearNumero(valor)}`).join(', ')
}

function formatearNumero(valor) {
  if (valor == null) return '—'
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return String(valor)
    if (Math.abs(valor) >= 1000) return valor.toFixed(0)
    if (Math.abs(valor) >= 1) return valor.toFixed(2)
    return valor.toPrecision(3)
  }
  return String(valor)
}
