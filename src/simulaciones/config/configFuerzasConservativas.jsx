import React from 'react'
import { Simulacion, ESTADO_SIMULACION } from '../../domain/simulacion/Simulacion.js'
import { NumeroInput } from '../componentes/NumeroInput.jsx'
import { PanelEstado } from '../componentes/PanelEstado.jsx'
import { PanelGraficas } from '../componentes/PanelGraficas.jsx'
import { EscenarioCaidaLibre } from '../escenarios/EscenarioCaidaLibre.jsx'

export function crearConfigFuerzasConservativas() {
  const parametrosIniciales = () => ({
    masaKg: 0,
    alturaInicialM: 0,
    velocidadInicialMs: 0,
  })

  const crearSimulacion = ({ parametros }) => {
    const datos = {
      masaKg: parametros?.masaKg,
      alturaInicialM: parametros?.alturaInicialM,
      velocidadInicialMs: parametros?.velocidadInicialMs,
    }
    const simulacion = new Simulacion({
      tipo: 'fuerzas-conservativas',
      parametros: { fuerzasConservativas: { ...datos } },
    })
    simulacion.configurarFuerzasConservativas()
    return simulacion
  }

  const renderPanelParametros = ({ parametros, setParametros, errorMensaje, acciones, estadoSimulacion, metricas }) => {
    if (estadoSimulacion !== ESTADO_SIMULACION.Configurando) {
      return (
        <PanelEstado
          metricas={[
            { etiqueta: 'Tiempo', valor: metricas.tiempo, unidad: 's' },
            { etiqueta: 'Altura', valor: metricas.altura, unidad: 'm' },
            { etiqueta: 'Velocidad', valor: metricas.velocidad, unidad: 'm/s' },
            { etiqueta: 'Aceleración', valor: metricas.aceleracion, unidad: 'm/s²' },
            { etiqueta: 'Trabajo gravedad', valor: metricas.trabajo_gravedad, unidad: 'J' },
            { etiqueta: 'E. potencial', valor: metricas.energia_potencial, unidad: 'J' },
            { etiqueta: 'E. cinética', valor: metricas.energia_cinetica, unidad: 'J' },
            { etiqueta: 'E. mecánica', valor: metricas.energia_mecanica, unidad: 'J' },
          ]}
          acciones={acciones}
        />
      )
    }

    return (
      <>
        <h3 className="text-slate-800 font-semibold">Parámetros</h3>
        <NumeroInput label="Masa (kg)" valor={parametros.masaKg} min={0} onChange={(v) => setParametros((prev) => ({ ...prev, masaKg: v }))} />
        <NumeroInput label="Altura inicial (m)" valor={parametros.alturaInicialM} min={0} onChange={(v) => setParametros((prev) => ({ ...prev, alturaInicialM: v }))} />
        <NumeroInput label="Velocidad inicial (m/s)" valor={parametros.velocidadInicialMs} onChange={(v) => setParametros((prev) => ({ ...prev, velocidadInicialMs: v }))} />
        <p className="text-xs text-slate-500">
          Configura la masa y la altura inicial de la esfera para estudiar cómo la fuerza gravitatoria (conservativa) transforma energía potencial en cinética.
        </p>
        {errorMensaje && <div className="text-sm text-rose-600">{errorMensaje}</div>}
        <button className="btn btn-green mt-2" onClick={() => acciones.iniciar()}>Iniciar simulación</button>
      </>
    )
  }

  const renderEscena = ({ parametros, metricas, estadoSimulacion, mostrarResultados, acciones, referencia }) => {
    const alturaInicial = Number(parametros.alturaInicialM || 0)
    const velocidadInicial = Number(parametros.velocidadInicialMs || 0)

    const alturaActual = estadoSimulacion === ESTADO_SIMULACION.Configurando
      ? alturaInicial
      : Number(metricas?.altura ?? alturaInicial)

    return (
      <EscenarioCaidaLibre
        referencia={referencia}
        alturaActual={alturaActual}
        mostrarBotonResultados={mostrarResultados}
        onVerResultados={acciones.verResultadosFinales}
      />
    )
  }

  const renderPanelResultados = ({ series }) => (
    <PanelGraficas
      bloques={[
        {
          titulo: 'Altura vs Tiempo',
          ejeY: 'Altura (m)',
          ejeX: 'Tiempo (s)',
          series: [{ etiqueta: 'Altura', datos: series['altura_vs_tiempo'] || [], color: '#0ea5e9' }],
        },
        {
          titulo: 'Velocidad vs Tiempo',
          ejeY: 'Velocidad (m/s)',
          ejeX: 'Tiempo (s)',
          series: [{ etiqueta: 'Velocidad', datos: series['velocidad_vs_tiempo'] || [], color: '#f97316' }],
        },
        {
          titulo: 'Energía mecánica vs Tiempo',
          ejeY: 'Energía (J)',
          ejeX: 'Tiempo (s)',
          series: [{ etiqueta: 'Energía mecánica', datos: series['energia_mecanica_vs_tiempo'] || [], color: '#22c55e' }],
        },
      ]}
    />
  )

  return {
    titulo: 'Caída Libre bajo Fuerza Conservativa',
    instrucciones: [
      'Configura masa, altura y velocidad inicial para estudiar cómo la gravedad transforma energía potencial en cinética.',
      'Observa la animación y verifica que la energía mecánica se mantiene constante cuando no hay fuerzas disipativas.',
      'Analiza las gráficas de altura, velocidad y energía para reforzar el concepto de fuerza conservativa.',
    ],
    seriesEsperadas: ['altura_vs_tiempo', 'velocidad_vs_tiempo', 'energia_mecanica_vs_tiempo'],
    parametrosIniciales,
    crearSimulacion,
    renderPanelParametros,
    renderEscena,
    renderPanelResultados,
  }
}
