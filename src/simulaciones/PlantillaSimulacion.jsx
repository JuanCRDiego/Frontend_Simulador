import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ESTADO_SIMULACION } from '../domain/simulacion/Simulacion.js'

const ALTURA_PANEL = 420

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend)

function inicializarSeries(seriesEsperadas = []) {
  const base = {}
  seriesEsperadas.forEach((id) => { base[id] = [] })
  return base
}

function extraerMetricas(simulacion) {
  const datos = {}
  if (simulacion?.metricas?.forEach) {
    simulacion.metricas.forEach((metrica, id) => {
      datos[id] = metrica?.obtenerUltimo?.() ?? null
    })
  }
  return datos
}


function extraerSeries(simulacion, seriesEsperadas = []) {
  const datos = inicializarSeries(seriesEsperadas)
  if (simulacion?.graficas?.forEach) {
    simulacion.graficas.forEach((grafica, id) => {
      datos[id] = grafica?.renderizar?.() ?? []
    })
  }
  return datos
}

// Plantilla que orquesta la interacción: recibe un "config" desde `SimulacionGeneral.jsx`
// crea la instancia de `Simulacion` y coordina la animación
// se invocan los métodos públicos de la clase de dominio (iniciar, pausar, actualizar, reiniciar, etc.).
export function PlantillaSimulacion({
  titulo,
  instrucciones = [],
  seriesEsperadas = [],
  parametrosIniciales = {},
  crearSimulacion,
  renderPanelParametros,
  renderEscena,
  renderPanelResultados,
  onFinalizarSimulacion,
}) {
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(true)
  const obtenerParametrosIniciales = useCallback(() => {
    const fuente = typeof parametrosIniciales === 'function'
      ? parametrosIniciales()
      : parametrosIniciales
    return clonarParametros(fuente || {})
  }, [parametrosIniciales])
  const [parametros, setParametros] = useState(() => obtenerParametrosIniciales())
  const [errorMensaje, setErrorMensaje] = useState('')

  const [fase, setFase] = useState('instrucciones')
  const [tiempo, setTiempo] = useState(0)
  const [metricas, setMetricas] = useState({})
  const [series, setSeries] = useState(() => inicializarSeries(seriesEsperadas))
  const [estadoSimulacion, setEstadoSimulacion] = useState(ESTADO_SIMULACION.Configurando)
  const [mostrarResultadosFinales, setMostrarResultadosFinales] = useState(false)
  const [resultadosFinales, setResultadosFinales] = useState(null)
  const [friccionActivaUI, setFriccionActivaUI] = useState(false)

  const simulacionRef = useRef(null)
  const rafRef = useRef(0)
  const ultimaMarcaRef = useRef(0)
  const notificacionFinalRef = useRef(false)
  const parametrosRef = useRef(parametros)

  useEffect(() => {
    parametrosRef.current = parametros
  }, [parametros])

  // Evita múltiples requestAnimationFrame pendientes cuando se pausa o reinicia.
  const detenerLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  // Bucle principal: avanza la simulación (delegado a `Simulacion.actualizar`)
  // y sincroniza métricas/series cada vez que `requestAnimationFrame` dispara.
  const loop = useCallback((timestamp) => {
    const simulacion = simulacionRef.current
    if (!simulacion) return

    if (!ultimaMarcaRef.current) ultimaMarcaRef.current = timestamp
    const delta = Math.min(0.05, (timestamp - ultimaMarcaRef.current) / 1000)
    ultimaMarcaRef.current = timestamp

    simulacion.actualizar(delta)

    setTiempo(simulacion.cronometro?.obtenerTiempo?.() ?? 0)
    setEstadoSimulacion(simulacion.estado)
    setMetricas(extraerMetricas(simulacion))
    setSeries(extraerSeries(simulacion, seriesEsperadas))

    if (simulacion.estado === ESTADO_SIMULACION.Finalizada) {
      setFase('finalizada')
      rafRef.current = 0
      return
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [seriesEsperadas])

  // Limpia los datos de las gráficas cuando la simulación cambia de modo.
  const reiniciarSeries = useCallback(() => {
    setSeries(inicializarSeries(seriesEsperadas))
  }, [seriesEsperadas])

  // Cuando cambian los parámetros iniciales (p.ej. se carga otro nivel) volver
  // a estado limpio y desactivar la fricción visual.
  useEffect(() => {
    const inicial = obtenerParametrosIniciales()
    setParametros(inicial)
    setFriccionActivaUI(false)
  }, [obtenerParametrosIniciales])

  // Recalcula las estructuras de series cuando se espera un set diferente.
  useEffect(() => {
    reiniciarSeries()
  }, [reiniciarSeries])

  // Al desmontar la plantilla cancelar cualquier `requestAnimationFrame`.
  useEffect(() => {
    return () => {
      detenerLoop()
    }
  }, [detenerLoop])

  // En el momento que la simulación termina se captura el snapshot final para
  // mostrárselo al usuario en el modal de resultados y notificar al exterior.
  useEffect(() => {
    if (estadoSimulacion === ESTADO_SIMULACION.Finalizada) {
      const simulacion = simulacionRef.current
      if (simulacion) {
        const resumen = construirResumenFinal(simulacion, seriesEsperadas)
        setResultadosFinales(resumen)
        if (!notificacionFinalRef.current && typeof onFinalizarSimulacion === 'function') {
          onFinalizarSimulacion({
            resumen,
            parametros: parametrosRef.current,
          })
          notificacionFinalRef.current = true
        }
      }
    } else {
      notificacionFinalRef.current = false
    }
  }, [estadoSimulacion, seriesEsperadas, onFinalizarSimulacion])

  // Acciones expuestas a los paneles de UI; cada callback delega en la instancia
  // de `Simulacion` creada por la fábrica recibida desde `SimulacionGeneral.jsx`.
  const acciones = useMemo(() => ({
    // Crea una nueva instancia de `Simulacion` según los parámetros vigentes
    // y arranca el bucle principal.
    iniciar: () => {
      try {
        setErrorMensaje('')
        detenerLoop()
        setMostrarResultadosFinales(false)
        setResultadosFinales(null)
        notificacionFinalRef.current = false

        const simulacionAnterior = simulacionRef.current
        const historialPrevio = simulacionAnterior?.resultado?.tabla?.toJSON?.()

        const simulacion = crearSimulacion?.({ parametros })
        if (!simulacion) throw new Error('No se pudo crear la simulación.')

        if (
          simulacionAnterior &&
          historialPrevio &&
          simulacionAnterior.tipo === simulacion.tipo &&
          simulacion.resultado?.tabla
        ) {
          const columnasPrevias = Array.isArray(historialPrevio.columnas) ? historialPrevio.columnas : []
          simulacion.resultado.tabla.establecerColumnas(columnasPrevias)
          if (Array.isArray(historialPrevio.filas)) {
            historialPrevio.filas.forEach((fila) => simulacion.resultado.tabla.agregarFila(fila))
          }
        }

        simulacionRef.current = simulacion
        ultimaMarcaRef.current = 0
        setFriccionActivaUI(false)
        simulacion.cajas?.forEach((caja) => { if (caja) caja.coeficienteFriccion = 0 })
        simulacion.vehiculos?.forEach((vehiculo) => { if (vehiculo) vehiculo.coeficienteFriccion = 0 })
        simulacion.establecerFriccionActiva?.(false)

        setTiempo(simulacion.cronometro?.obtenerTiempo?.() ?? 0)
        setEstadoSimulacion(simulacion.estado)
        setMetricas(extraerMetricas(simulacion))
        setSeries(extraerSeries(simulacion, seriesEsperadas))
        setFase('simulacion')
        setMostrarInstrucciones(false)

        simulacion.iniciar()
        setEstadoSimulacion(simulacion.estado)
        rafRef.current = requestAnimationFrame(loop)
      } catch (error) {
        console.error(error)
        setErrorMensaje(error?.message || 'No se pudo iniciar la simulación. Verifica los parámetros.')
      }
    },
    // Detiene la simulación y el loop de animación.
    pausar: () => {
      simulacionRef.current?.pausar?.()
      detenerLoop()
    },
    // Reanuda el cronómetro y vuelve a solicitar frames.
    reanudar: () => {
      const simulacion = simulacionRef.current
      if (!simulacion) return
      simulacion.reanudar()
      if (!rafRef.current) {
        ultimaMarcaRef.current = 0
        rafRef.current = requestAnimationFrame(loop)
      }
    },
    // Restablece la simulación y la interfaz a su estado inicial.
    reiniciar: () => {
      detenerLoop()
      simulacionRef.current?.reiniciar?.()
      setParametros(obtenerParametrosIniciales())
      setMostrarInstrucciones(true)
      setErrorMensaje('')
      setFase('instrucciones')
      setTiempo(0)
      setMetricas({})
      reiniciarSeries()
      setEstadoSimulacion(ESTADO_SIMULACION.Configurando)
      setResultadosFinales(null)
      setMostrarResultadosFinales(false)
      setFriccionActivaUI(false)
      notificacionFinalRef.current = false
      const simulacion = simulacionRef.current
      simulacion?.establecerFriccionActiva?.(false)
      simulacion?.cajas?.forEach((caja) => { if (caja) caja.coeficienteFriccion = 0 })
      simulacion?.vehiculos?.forEach((vehiculo) => { if (vehiculo) vehiculo.coeficienteFriccion = 0 })
    },
    obtenerSimulacion: () => simulacionRef.current,
    alternarFriccion: () => simulacionRef.current?.alternarFriccion?.(),
    // Encapsula la lógica para activar/desactivar fricción desde los botones.
    establecerFriccion: (activa) => {
      const simulacion = simulacionRef.current
      if (!simulacion) return
      const habilitada = esFriccionPermitida(parametros)
      if (activa && !habilitada) return
      const mu = obtenerMuDesdeParametros(parametros, activa && habilitada)
      const activar = Boolean(activa && habilitada)
      simulacion.cajas?.forEach((caja) => { if (caja) caja.coeficienteFriccion = activar ? mu : 0 })
      simulacion.vehiculos?.forEach((vehiculo) => { if (vehiculo) vehiculo.coeficienteFriccion = activar ? mu : 0 })
      simulacion.establecerFriccionActiva?.(activar)
      if (!activar) {
        simulacion._contextoTrabajo && (simulacion._contextoTrabajo.bloqueadoPorFriccion = false)
        if (!rafRef.current && simulacion.estado === ESTADO_SIMULACION.Corriendo) {
          ultimaMarcaRef.current = 0
          rafRef.current = requestAnimationFrame(loop)
        }
      }
      setFriccionActivaUI(activar)
    },
    getParametrosModelo: () => simulacionRef.current?.getParametrosModelo?.(),
    // Abre el modal de resultados (generándolo si aún no existía).
    verResultadosFinales: () => {
      if (!resultadosFinales) {
        const simulacion = simulacionRef.current
        if (simulacion) {
          const resumen = construirResumenFinal(simulacion, seriesEsperadas)
          setResultadosFinales(resumen)
        }
      }
      setMostrarResultadosFinales(true)
    },
    cerrarResultadosFinales: () => setMostrarResultadosFinales(false),
    // Permite eliminar filas de la tabla desde el modal y refrescar la vista.
    eliminarResumen: (indice) => {
      const simulacion = simulacionRef.current
      if (!simulacion || typeof indice !== 'number') return
      simulacion.eliminarResumen?.(indice)
      const resumen = construirResumenFinal(simulacion, seriesEsperadas)
      setResultadosFinales(resumen)
    },
  }), [crearSimulacion, detenerLoop, loop, obtenerParametrosIniciales, parametros, reiniciarSeries, resultadosFinales, seriesEsperadas])

  const renderParametros = renderPanelParametros || (() => null)
  const renderResultados = renderPanelResultados || (() => null)
  const renderCentro = renderEscena || (() => null)

  const hayGraficas = useMemo(() => (
    Object.values(series).some((lista) => Array.isArray(lista) && lista.length > 0)
  ), [series])

  const puedeVerResultados = estadoSimulacion === ESTADO_SIMULACION.Finalizada && Boolean(simulacionRef.current)
  const mostrarResultados = puedeVerResultados

  return (
    <div className="w-full">
      <div className="header-bar rounded-b-xl">
        <h2 className="header-title">{titulo}</h2>
        <span className="pill-time">Tiempo: {tiempo.toFixed(2)}</span>
      </div>

      <section className="grid grid-cols-[280px_auto_360px] gap-4 mt-4 items-start">
          {/* Panel izquierdo: formulario / métricas */}
        <div className="aside-sand grid gap-3 text-sm" style={{ height: ALTURA_PANEL, overflow: 'hidden', paddingRight: '0.5rem' }}>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: ALTURA_PANEL }}>
            {renderParametros({
              fase,
              parametros,
              setParametros,
              metricas,
              series,
              estadoSimulacion,
              acciones,
              errorMensaje,
            })}
          </div>
        </div>
            {/* Panel central: escena/visualización */}
        <div className="card relative overflow-hidden" style={{ height: ALTURA_PANEL }}>
          {renderCentro({
            fase,
            parametros,
            setParametros,
            metricas,
            series,
            tiempo,
            estadoSimulacion,
            acciones,
            mostrarResultados,
            friccionActiva: friccionActivaUI,
          })}
        </div>
             {/* Panel derecho: gráficos y resultados en vivo */}
        <div className="panel-mint grid gap-3" style={{ height: ALTURA_PANEL, overflow: 'hidden' }}>
          {renderResultados({
            fase,
            parametros,
            metricas,
            series,
            hayGraficas,
            estadoSimulacion,
            acciones,
          })}
        </div>
      </section>
            {/* Modal con resumen final */}
      {mostrarResultadosFinales && resultadosFinales && (
        <ModalResultadosFinales
          datos={resultadosFinales}
          onClose={acciones.cerrarResultadosFinales}
          onEliminarFila={acciones.eliminarResumen}
        />
      )}
          {/* Overlay de instrucciones iniciales */}
      {mostrarInstrucciones && instrucciones.length > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6">
          <div className="w-[min(90%,720px)] bg-white rounded-xl shadow-card p-6 grid gap-3">
            <h3 className="text-xl font-semibold text-slate-800">Instrucciones</h3>
            <ol className="list-decimal pl-5 text-slate-700 text-sm space-y-1">
              {instrucciones.map((paso, idx) => <li key={idx}>{paso}</li>)}
            </ol>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-green" onClick={() => setMostrarInstrucciones(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { ALTURA_PANEL }

function clonarParametros(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => clonarParametros(item))
  }
  if (valor && typeof valor === 'object') {
    return Object.keys(valor).reduce((acumulado, clave) => {
      acumulado[clave] = clonarParametros(valor[clave])
      return acumulado
    }, {})
  }
  return valor
}

function esFriccionPermitida(parametros) {
  if (!parametros || typeof parametros !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(parametros, 'friccionActiva')) {
    return Boolean(parametros.friccionActiva)
  }
  return false
}

function obtenerMuDesdeParametros(parametros, activa) {
  if (!activa) return 0
  if (!parametros || typeof parametros !== 'object') return 0
  if (Object.prototype.hasOwnProperty.call(parametros, 'coeficienteMu')) {
    return Number(parametros.coeficienteMu) || 0
  }
  return 0
}

function construirResumenFinal(simulacion, seriesEsperadas = []) {
  if (!simulacion) return null

  const metricasTiempoReal = []
  if (simulacion.metricas?.forEach) {
    simulacion.metricas.forEach((metrica, id) => {
      const nombre = metrica?.nombre ?? id
      const unidad = metrica?.unidad ?? ''
      const valor = metrica?.obtenerUltimo?.() ?? null
      metricasTiempoReal.push({ id, nombre, unidad, valor })
    })
  }

  const series = extraerSeries(simulacion, seriesEsperadas)

  let resultadoDominio = null
  try {
    resultadoDominio = simulacion.obtenerResultados?.()
  } catch (error) {
    console.warn('No se pudo obtener resultados de la simulación.', error)
  }

  const metricasAjustadas = ajustarMetricasConSeries(metricasTiempoReal, series)

  return {
    tipo: simulacion?.tipo ?? '',
    metricasTiempoReal: metricasAjustadas,
    series,
    resumenDominio: integrarResumenDominio(normalizarResultadoDominio(resultadoDominio), metricasAjustadas),
  }
}

function normalizarResultadoDominio(resultado) {
  if (!resultado) return null

  const tablaOrigen = resultado.tabla
  const tabla = tablaOrigen
    ? {
        columnas: Array.isArray(tablaOrigen.columnas) ? tablaOrigen.columnas.slice() : [],
        filas: Array.isArray(tablaOrigen.filas)
          ? tablaOrigen.filas.map((fila) => (Array.isArray(fila) ? fila.slice() : [fila]))
          : [],
      }
    : null

  const metricasResumen = []
  const posiblesValores = resultado.metricas?.valores
  if (posiblesValores instanceof Map) {
    posiblesValores.forEach((valor, clave) => {
      metricasResumen.push({ clave, valor })
    })
  } else if (posiblesValores && typeof posiblesValores === 'object') {
    Object.entries(posiblesValores).forEach(([clave, valor]) => {
      metricasResumen.push({ clave, valor })
    })
  }

  const interpretacion = typeof resultado.interpretacion === 'string'
    ? resultado.interpretacion
    : resultado.interpretacion?.texto ?? ''
  const interpretacionFallback = interpretacion && interpretacion.trim()
    ? interpretacion.trim()
    : 'La simulación ha concluido con los parámetros configurados. Observa la relación entre las métricas registradas y las gráficas para analizar cómo evolucionaron las magnitudes durante la ejecución.'

  const graficos = Array.isArray(resultado.graficos)
    ? resultado.graficos.map((grafico, idx) => ({
        titulo: grafico?.titulo || `Gráfico ${idx + 1}`,
        tipo: grafico?.tipo || 'linea',
        puntos: Array.isArray(grafico?.datos) ? grafico.datos.length : 0,
        ejeX: grafico?.ejeX || '',
        ejeY: grafico?.ejeY || '',
      }))
    : []

  return {
    tabla,
    metricasResumen,
    interpretacion: interpretacionFallback,
    graficos,
  }
}

function integrarResumenDominio(resumenDominio, metricasTiempoReal) {
  const base = resumenDominio ? { ...resumenDominio } : {}
  const tabla = base.tabla
  const tieneTabla = tabla && (
    (Array.isArray(tabla.columnas) && tabla.columnas.length > 0) ||
    (Array.isArray(tabla.filas) && tabla.filas.length > 0)
  )

  if (!tieneTabla) {
    base.tabla = {
      columnas: ['Magnitud', 'Valor', 'Unidad'],
      filas: metricasTiempoReal.map(({ nombre, valor, unidad }) => [
        nombre || '—',
        formatValor(valor),
        unidad || '',
      ]),
    }
  }

  const interpretacionActual = base.interpretacion && String(base.interpretacion).trim()
  if (!interpretacionActual) {
    base.interpretacion = 'La simulación ha concluido con los parámetros configurados. Observa la relación entre las métricas registradas y las gráficas para analizar cómo evolucionaron las magnitudes durante la ejecución.'
  }

  return base
}

function normalizarTabla(tabla) {
  if (!tabla) return null

  const filas = Array.isArray(tabla.filas)
    ? tabla.filas.map((fila) => {
        if (Array.isArray(fila)) return fila.slice()
        if (fila && typeof fila === 'object') return Object.values(fila)
        return [fila]
      })
    : []

  let columnas = Array.isArray(tabla.columnas)
    ? tabla.columnas.slice()
    : []

  if (columnas.length === 0 && filas.length > 0) {
    const maxColumnas = filas.reduce((acc, fila) => Math.max(acc, fila.length), 0)
    columnas = Array.from({ length: maxColumnas }, (_, idx) => `Columna ${idx + 1}`)
  }

  const maxColumnas = columnas.length
  const filasNormalizadas = filas.map((fila) => {
    if (fila.length === maxColumnas) return fila
    const copia = fila.slice()
    while (copia.length < maxColumnas) copia.push('')
    return copia
  })

  return {
    columnas,
    filas: filasNormalizadas,
  }
}

function ModalResultadosFinales({ datos, onClose, onEliminarFila }) {
  if (!datos) return null

  const { tipo, metricasTiempoReal = [], series = {}, resumenDominio } = datos
  const seriesEntradas = Object.entries(series || {})
  const palette = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#14b8a6']
  const seriesDetalle = seriesEntradas.map(([id, puntos], index) => {
    const lista = Array.isArray(puntos) ? puntos : []
    const dataset = lista.map((p) => ({
      x: Number(p?.x) ?? 0,
      y: Number(p?.y) ?? 0,
    }))
    const ultimo = dataset.length > 0 ? dataset[dataset.length - 1] : null
    const color = palette[index % palette.length]
    return {
      id,
      total: dataset.length,
      ultimo,
      color,
      data: dataset,
    }
  })

  const metricasResumenDominio = resumenDominio?.metricasResumen || []
  const tabla = normalizarTabla(resumenDominio?.tabla)
  const interpretacion = resumenDominio?.interpretacion
    ? String(resumenDominio.interpretacion).trim()
    : ''
  const graficos = resumenDominio?.graficos || []

  const jsonExport = JSON.stringify({
    tipo,
    metricasTiempoReal,
    series,
    resultado: resumenDominio,
  }, null, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-6">
      <div className="w-[min(960px,100%)] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">Resultados finales</h3>
            {tipo && <p className="text-sm text-slate-600 m-0">Simulación: {tipo}</p>}
          </div>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
        </div>

        {metricasTiempoReal.length > 0 && (
          <section>
            <h4 className="text-base font-semibold text-slate-800 mb-3">Métricas en el instante final</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metricasTiempoReal.map(({ id, nombre, unidad, valor }) => (
                <div key={id} className="panel-mint px-3 py-2 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide m-0">{nombre}</p>
                  <p className="text-lg font-semibold text-slate-900 m-0">{formatValor(valor)} {unidad}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {metricasResumenDominio.length > 0 && (
          <section>
            <h4 className="text-base font-semibold text-slate-800 mb-2">Resumen calculado</h4>
            <ul className="grid gap-2 text-sm text-slate-700">
              {metricasResumenDominio.map(({ clave, valor }) => (
                <li key={clave} className="flex justify-between gap-3">
                  <span>{clave}</span>
                  <span className="font-semibold text-slate-900">{formatValor(valor)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tabla && (tabla.columnas.length > 0 || tabla.filas.length > 0) && (
          <section>
            <h4 className="text-base font-semibold text-slate-800 mb-2">Tabla de resultados</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full text-sm text-slate-700">
                {tabla.columnas.length > 0 && (
                  <thead className="bg-slate-100">
                    <tr>
                      {tabla.columnas.map((columna, idx) => (
                        <th key={idx} className="px-3 py-2 text-left uppercase text-xs tracking-wide text-slate-500">{columna}</th>
                      ))}
                      {typeof onEliminarFila === 'function' && (
                        <th className="px-3 py-2 text-left uppercase text-xs tracking-wide text-slate-500">Acciones</th>
                      )}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {tabla.filas.length > 0 ? tabla.filas.map((fila, idx) => (
                    <tr key={idx} className="border-t border-slate-200">
                      {fila.map((celda, celdaIdx) => (
                        <td key={celdaIdx} className="px-3 py-2">
                          {Number.isFinite(celda) ? formatValor(celda) : String(celda ?? '')}
                        </td>
                      ))}
                      {typeof onEliminarFila === 'function' && (
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                            onClick={() => onEliminarFila(idx)}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-3 text-slate-500 text-sm" colSpan={Math.max(1, (tabla.columnas.length + (typeof onEliminarFila === 'function' ? 1 : 0)) || 1)}>
                        La simulación no registró filas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {seriesDetalle.length > 0 && (
          <section>
            <h4 className="text-base font-semibold text-slate-800 mb-2">Series temporales</h4>
            <div className="grid gap-3">
              {seriesDetalle.map(({ id, total, ultimo, color, data }) => (
                <div key={id} className="card border border-slate-200 rounded-xl p-3 text-sm text-slate-700">
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 m-0">{id}</p>
                      <p className="m-0 text-xs text-slate-500">Puntos registrados: {total}</p>
                      {ultimo && (
                        <p className="m-0 text-xs text-slate-500">
                          Último punto → t={formatValor(ultimo.x)} s, valor={formatValor(ultimo.y)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-48">
                    <Line
                      data={{
                        datasets: [{
                          label: id,
                          data,
                          borderColor: color,
                          backgroundColor: `${color}33`,
                          borderWidth: 2,
                          pointRadius: 0,
                          tension: 0.15,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        parsing: false,
                        animation: { duration: 0 },
                        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
                        scales: {
                          x: { type: 'linear', ticks: { color: '#475569' }, grid: { color: 'rgba(148,163,184,0.15)' }, title: { display: true, text: 'Tiempo (s)', color: '#334155' } },
                          y: { ticks: { color: '#475569' }, grid: { color: 'rgba(148,163,184,0.15)' }, title: { display: true, text: 'Valor', color: '#334155' } },
                        },
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {interpretacion && (
          <section>
            <h4 className="text-base font-semibold text-slate-800 mb-2">Interpretación</h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap m-0">{interpretacion}</p>
          </section>
        )}

        {graficos.length > 0 && (
          <section>
            <h4 className="text-base font-semibold text-slate-800 mb-2">Gráficos finales</h4>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {graficos.map((grafico, idx) => (
                <li key={`${grafico.titulo}-${idx}`}>
                  {grafico.titulo} — {grafico.puntos} puntos ({grafico.tipo})
                  {grafico.ejeX && grafico.ejeY && ` · ${grafico.ejeX} vs ${grafico.ejeY}`}
                </li>
              ))}
            </ul>
          </section>
        )}

        <details className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">Ver datos en formato JSON</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{jsonExport}</pre>
        </details>
      </div>
    </div>
  )
}

function formatValor(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return String(valor)
  if (Math.abs(numero) >= 1000) return numero.toFixed(0)
  if (Math.abs(numero) >= 1) return numero.toFixed(2)
  return numero.toPrecision(3)
}

function ajustarMetricasConSeries(metricasTiempoReal, series) {
  if (!Array.isArray(metricasTiempoReal)) return metricasTiempoReal
  const resultado = metricasTiempoReal.map((m) => ({ ...m }))
  const velocidadSerie = Array.isArray(series?.velocidad_vs_tiempo) ? series.velocidad_vs_tiempo : []
  if (velocidadSerie.length > 0) {
    const ultimaNoCero = [...velocidadSerie].reverse().find((punto) => Math.abs(Number(punto?.y) || 0) > 1e-6)
    if (ultimaNoCero) {
      const metricaVelocidad = resultado.find((m) => m.id === 'velocidad')
      if (metricaVelocidad) metricaVelocidad.valor = Number(ultimaNoCero.y) || metricaVelocidad.valor
    }
  }
  return resultado
}
