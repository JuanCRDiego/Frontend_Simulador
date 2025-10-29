import React from 'react'
import { Simulacion, ESTADO_SIMULACION } from '../../domain/simulacion/Simulacion.js'
import { NumeroInput } from '../componentes/NumeroInput.jsx'
import { PanelEstado } from '../componentes/PanelEstado.jsx'
import { PanelGraficas } from '../componentes/PanelGraficas.jsx'
import { EscenarioTrabajoVariable } from '../escenarios/EscenarioTrabajoVariable.jsx'

export function crearConfigTrabajoVariable() {
  const parametrosIniciales = () => ({
    masaKg: 0,
    k: 0,
    distanciaMetaM: 0,
    coeficienteMu: 0,
    friccionActiva: false,
  })

  const crearSimulacion = ({ parametros }) => {
    const datos = {
      masaKg: parametros?.masaKg,
      k: parametros?.k,
      distanciaMetaM: parametros?.distanciaMetaM,
      friccionActiva: Boolean(parametros?.friccionActiva),
      coeficienteMu: Number(parametros?.coeficienteMu) || 0,
      offsetN: 0.1,
    }

    const simulacion = new Simulacion({
      tipo: 'trabajo-variable',
      parametros: { trabajoVariable: { ...datos } },
    })
    simulacion.configurarTrabajoVariable()
    return simulacion
  }

  const renderPanelParametros = ({ parametros, setParametros, errorMensaje, acciones, estadoSimulacion, metricas }) => {
    if (estadoSimulacion !== ESTADO_SIMULACION.Configurando) {
      return (
        <PanelEstado
          metricas={[
            { etiqueta: 'Tiempo', valor: metricas.tiempo, unidad: 's' },
            { etiqueta: 'Distancia', valor: metricas.distancia, unidad: 'm' },
            { etiqueta: 'Fuerza', valor: metricas.fuerza_actual, unidad: 'N' },
            { etiqueta: 'Velocidad', valor: metricas.velocidad, unidad: 'm/s' },
            { etiqueta: 'Trabajo aplicado', valor: metricas.trabajo_aplicado, unidad: 'J' },
            { etiqueta: 'Trabajo fricción', valor: metricas.trabajo_friccion, unidad: 'J' },
            { etiqueta: 'Trabajo neto', valor: metricas.trabajo_neto, unidad: 'J' },
          ]}
          acciones={acciones}
        />
      )
    }

    return (
      <>
        <h3 className="text-slate-800 font-semibold">Parámetros</h3>
        <NumeroInput label="Masa (kg)" valor={parametros.masaKg} onChange={(v) => setParametros(prev => ({ ...prev, masaKg: v }))} />
        <NumeroInput label="Constante k (N/m)" valor={parametros.k} min={0} onChange={(v) => setParametros(prev => ({ ...prev, k: v }))} />
        <NumeroInput label="Distancia objetivo (m)" valor={parametros.distanciaMetaM} min={0} onChange={(v) => setParametros(prev => ({ ...prev, distanciaMetaM: v }))} />
        <NumeroInput label="Coeficiente de fricción μ" valor={parametros.coeficienteMu} min={0} onChange={(v) => setParametros(prev => ({ ...prev, coeficienteMu: v }))} />
        <label className="text-sm text-slate-700 flex items-center gap-2">
          <input
            type="checkbox"
            checked={parametros.friccionActiva}
            onChange={(e) => setParametros(prev => ({ ...prev, friccionActiva: e.target.checked }))}
          />
          Habilitar fricción dependiente de μ
        </label>
        <p className="text-xs text-slate-500">
          La fuerza aplicada aumenta con la distancia restante. Observa cómo cambia el trabajo total y la fuerza neta.
        </p>
        {errorMensaje && <div className="text-sm text-rose-600">{errorMensaje}</div>}
        <button className="btn btn-green mt-2" onClick={() => acciones.iniciar()}>Iniciar simulación</button>
      </>
    )
  }

  const renderEscena = ({ parametros, metricas, tiempo, estadoSimulacion, mostrarResultados, acciones, referencia, friccionActiva = false }) => {
    const distanciaAct = Number(metricas?.distancia || 0)
    const distanciaMeta = Number(parametros.distanciaMetaM) || 1
    const fuerza = Number(metricas?.fuerza_actual || 0)
    const velocidad = Number(metricas?.velocidad || 0)
    const trabajoAplicado = Number(metricas?.trabajo_aplicado || 0)
    const trabajoNeto = Number(metricas?.trabajo_neto || 0)
    const trabajoFriccion = Number(metricas?.trabajo_friccion || 0)
    const coeficienteMu = Number(parametros.coeficienteMu) || 0
    const friccionHabilitada = Boolean(parametros.friccionActiva)

    return (
      <EscenarioTrabajoVariable
        referencia={referencia}
        distancia={distanciaAct}
        distanciaMeta={distanciaMeta}
        fuerza={fuerza}
        velocidad={velocidad}
        trabajoAplicado={trabajoAplicado}
        trabajoNeto={trabajoNeto}
        trabajoFriccion={trabajoFriccion}
        tiempoSimulado={tiempo}
        friccionActiva={friccionActiva}
        friccionHabilitada={friccionHabilitada}
        coeficienteMu={coeficienteMu}
        onToggleFriccion={() => acciones.establecerFriccion(!friccionActiva)}
        enModoInstrucciones={estadoSimulacion === ESTADO_SIMULACION.Configurando}
        mostrarBotonResultados={mostrarResultados}
        onVerResultados={acciones.verResultadosFinales}
      />
    )
  }

  return {
    titulo: 'Trabajo con Fuerza Variable',
    instrucciones: [
      'Configura la masa, la constante k y la distancia meta.',
      'Inicia la simulación para visualizar la fuerza variable y el trabajo acumulado.',
      'Activa la fricción para estudiar su efecto sobre el trabajo neto.',
    ],
    seriesEsperadas: ['trabajo_vs_distancia', 'fuerza_vs_distancia'],
    parametrosIniciales,
    crearSimulacion,
    renderPanelParametros,
    renderEscena,
    renderPanelResultados: renderPanelResultadosTrabajo,
  }
}

function renderPanelResultadosTrabajo({ series }) {
  const trabajoSerie = series['trabajo_vs_distancia'] || []
  const fuerzaSerie = series['fuerza_vs_distancia'] || []
  return (
    <PanelGraficas
      bloques={[
        {
          titulo: 'Trabajo vs Distancia',
          series: [{ etiqueta: 'Trabajo', datos: trabajoSerie, color: '#22c55e' }],
          ejeY: 'Trabajo (J)',
          ejeX: 'Distancia (m)',
        },
        {
          titulo: 'Fuerza vs Distancia',
          series: [{ etiqueta: 'Fuerza', datos: fuerzaSerie, color: '#a855f7' }],
          ejeY: 'Fuerza (N)',
          ejeX: 'Distancia (m)',
        },
      ]}
    />
  )
}
