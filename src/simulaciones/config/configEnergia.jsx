import React from 'react'
import { Simulacion, ESTADO_SIMULACION } from '../../domain/simulacion/Simulacion.js'
import { NumeroInput } from '../componentes/NumeroInput.jsx'
import { PanelEstado } from '../componentes/PanelEstado.jsx'
import { PanelGraficas } from '../componentes/PanelGraficas.jsx'
import { EscenarioEnergia } from '../escenarios/EscenarioEnergia.jsx'

export function crearConfigEnergia() {
  const parametrosIniciales = () => ({
    masaKg: 0,
    velocidadFinalMs: 0,
    distanciaMetaM: 0,
  })

  const crearSimulacion = ({ parametros }) => {
    const datos = {
      masaKg: parametros?.masaKg,
      velocidadFinalMs: parametros?.velocidadFinalMs,
      distanciaMetaM: parametros?.distanciaMetaM,
    }
    const simulacion = new Simulacion({
      tipo: 'energia-cinetica',
      parametros: { energiaCinetica: { ...datos } },
    })
    simulacion.configurarEnergiaCinetica()
    return simulacion
  }

  const renderPanelParametros = ({ parametros, setParametros, errorMensaje, acciones, estadoSimulacion, metricas }) => {
    if (estadoSimulacion !== ESTADO_SIMULACION.Configurando) {
      return (
        <PanelEstado
          metricas={[
            { etiqueta: 'Tiempo', valor: metricas.tiempo, unidad: 's' },
            { etiqueta: 'Distancia', valor: metricas.distancia, unidad: 'm' },
            { etiqueta: 'Velocidad', valor: metricas.velocidad, unidad: 'm/s' },
            { etiqueta: 'Energía cinética', valor: metricas.energia_cinetica, unidad: 'J' },
          ]}
          acciones={acciones}
        />
      )
    }

    return (
      <>
        <h3 className="text-slate-800 font-semibold">Parámetros</h3>
        <NumeroInput label="Masa (kg)" valor={parametros.masaKg} onChange={(v) => setParametros(prev => ({ ...prev, masaKg: v }))} />
        <NumeroInput label="Velocidad final (m/s)" valor={parametros.velocidadFinalMs} min={0} onChange={(v) => setParametros(prev => ({ ...prev, velocidadFinalMs: v }))} />
        <NumeroInput label="Distancia meta (m)" valor={parametros.distanciaMetaM} min={0} onChange={(v) => setParametros(prev => ({ ...prev, distanciaMetaM: v }))} />
        {errorMensaje && <div className="text-sm text-rose-600">{errorMensaje}</div>}
        <button className="btn btn-green mt-2" onClick={() => acciones.iniciar()}>Iniciar simulación</button>
      </>
    )
  }

  const renderEscena = ({ parametros, metricas, tiempo, estadoSimulacion, mostrarResultados, acciones, referencia }) => {
    const distanciaMeta = Number(parametros.distanciaMetaM) || 1
    const distanciaActual = Number(metricas?.distancia || 0)
    const velocidadActual = Number(metricas?.velocidad || 0)
    const energia = Number(metricas?.energia_cinetica || 0)
    const progreso = distanciaMeta > 0 ? Math.min(1, distanciaActual / distanciaMeta) : 0

    return (
      <EscenarioEnergia
        referencia={referencia}
        progreso={progreso}
        distanciaActual={distanciaActual}
        distanciaMeta={distanciaMeta}
        velocidad={velocidadActual}
        energia={energia}
        tiempoSimulado={tiempo}
        enModoInstrucciones={estadoSimulacion === ESTADO_SIMULACION.Configurando}
        mostrarBotonResultados={mostrarResultados}
        onVerResultados={acciones.verResultadosFinales}
      />
    )
  }

  const renderPanelResultados = ({ series }) => (
    <PanelGraficas
      bloques={[
        {
          titulo: 'Energía cinética',
          series: [{ etiqueta: 'Energía', datos: series['energia_vs_tiempo'] || [], color: '#f97316' }],
          ejeY: 'Energía (J)',
          ejeX: 'Tiempo (s)',
        },
        {
          titulo: 'Velocidad',
          series: [{ etiqueta: 'Velocidad', datos: series['velocidad_vs_tiempo'] || [], color: '#22c55e' }],
          ejeY: 'Velocidad (m/s)',
          ejeX: 'Tiempo (s)',
        },
      ]}
    />
  )

  return {
    titulo: 'Simulación de Energía Cinética',
    instrucciones: [
      'Define la masa del vehículo, la velocidad objetivo y la distancia a recorrer.',
      'Inicia la simulación para observar cómo crece la energía cinética junto con la velocidad.',
      'Analiza las gráficas de energía y velocidad para relacionar ambas magnitudes.',
    ],
    seriesEsperadas: ['energia_vs_tiempo', 'velocidad_vs_tiempo'],
    parametrosIniciales,
    crearSimulacion,
    renderPanelParametros,
    renderEscena,
    renderPanelResultados,
  }
}
