import React from 'react'
import { Simulacion, ESTADO_SIMULACION } from '../../domain/simulacion/Simulacion.js'
import { ParametrosPotencia } from '../../domain/simulacion/parametros/ParametrosPotencia.js'
import { NumeroInput } from '../componentes/NumeroInput.jsx'
import { PanelEstado } from '../componentes/PanelEstado.jsx'
import { PanelGraficas } from '../componentes/PanelGraficas.jsx'
import { EscenarioPotencia } from '../escenarios/EscenarioPotencia.jsx'

export function crearConfigPotencia() {


  const parametrosIniciales = () => ({
    masaKg: 0,
    alturaM: 0,
    tiempoRapidoS: 0,
    tiempoLentoS: 0,
  })

  const crearSimulacion = ({ parametros }) => {
    const datos = {
      masaKg: parametros?.masaKg,
      alturaM: parametros?.alturaM,
      tiempoRapidoS: parametros?.tiempoRapidoS,
      tiempoLentoS: parametros?.tiempoLentoS,
    }
    const simulacion = new Simulacion({
      tipo: 'potencia',
      parametros: { potencia: { ...datos } },
    })
    simulacion.configurarPotencia()
    return simulacion
  }

  const renderPanelParametros = ({ parametros, setParametros, errorMensaje, acciones, estadoSimulacion, metricas }) => {
    if (estadoSimulacion !== ESTADO_SIMULACION.Configurando) {
      return (
        <PanelEstado
          metricas={[
            { etiqueta: 'Tiempo', valor: metricas.tiempo, unidad: 's' },
            { etiqueta: 'Trabajo total', valor: metricas.trabajo_total, unidad: 'J' },
            { etiqueta: 'Potencia rápida', valor: metricas.potencia_rapida, unidad: 'W' },
            { etiqueta: 'Potencia lenta', valor: metricas.potencia_lenta, unidad: 'W' },
            { etiqueta: 'Altura rápida', valor: metricas.altura_rapida, unidad: 'm' },
            { etiqueta: 'Altura lenta', valor: metricas.altura_lenta, unidad: 'm' },
          ]}
          acciones={acciones}
        />
      )
    }

    return (
      <>
        <h3 className="text-slate-800 font-semibold">Parámetros</h3>
        <NumeroInput label="Masa (kg)" valor={parametros.masaKg} onChange={(v) => setParametros(prev => ({ ...prev, masaKg: v }))} />
        <NumeroInput label="Altura (m)" valor={parametros.alturaM} min={0} onChange={(v) => setParametros(prev => ({ ...prev, alturaM: v }))} />
        <NumeroInput label="Tiempo ascensor rápido (s)" valor={parametros.tiempoRapidoS} min={0} onChange={(v) => setParametros(prev => ({ ...prev, tiempoRapidoS: v }))} />
        <NumeroInput label="Tiempo ascensor lento (s)" valor={parametros.tiempoLentoS} min={0} onChange={(v) => setParametros(prev => ({ ...prev, tiempoLentoS: v }))} />
        {errorMensaje && <div className="text-sm text-rose-600">{errorMensaje}</div>}
        <button className="btn btn-green mt-2" onClick={() => acciones.iniciar()}>Iniciar simulación</button>
      </>
    )
  }

  const renderEscena = ({ parametros, metricas, estadoSimulacion, mostrarResultados, acciones, referencia }) => {
    const alturaMeta = Number(parametros.alturaM) || 1
    const alturaRapida = Number(metricas?.altura_rapida || 0)
    const alturaLenta = Number(metricas?.altura_lenta || 0)
    const alturaMaxima = Math.max(1, ParametrosPotencia.ALTURA_MAX || alturaMeta)

    const ratioRapido = Math.min(1, Math.max(0, alturaRapida / alturaMaxima))
    const ratioLento = Math.min(1, Math.max(0, alturaLenta / alturaMaxima))

    return (
      <EscenarioPotencia
        referencia={referencia}
        ratioRapido={ratioRapido}
        ratioLento={ratioLento}
        enModoInstrucciones={estadoSimulacion === ESTADO_SIMULACION.Configurando}
        mostrarBotonResultados={mostrarResultados}
        onVerResultados={acciones.verResultadosFinales}
      />
    )
  }

  const renderPanelResultados = ({ series }) => (
    <PanelGraficas
      bloques={[{
        titulo: 'Potencia vs Tiempo',
        series: [
          { etiqueta: 'Rápido', datos: series['potencia_vs_tiempo_rapida'] || [], color: '#f97316' },
          { etiqueta: 'Lento', datos: series['potencia_vs_tiempo_lenta'] || [], color: '#0ea5e9' },
        ],
        ejeY: 'Potencia (W)',
        ejeX: 'Tiempo (s)',
      }]}
    />
  )

  return {
    titulo: 'Simulación de Potencia',
    instrucciones: [
      'Configura masa, altura y tiempos para cada ascensor.',
      'Inicia la simulación para observar la potencia instantánea y el trabajo realizado.',
      'Compara qué ascensor entrega más potencia pese a realizar el mismo trabajo.',
    ],
    seriesEsperadas: ['potencia_vs_tiempo_rapida', 'potencia_vs_tiempo_lenta'],
    parametrosIniciales,
    crearSimulacion,
    renderPanelParametros,
    renderEscena,
    renderPanelResultados,
  }
}
