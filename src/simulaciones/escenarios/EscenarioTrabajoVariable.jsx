import React from 'react'
import { formatValor } from '../utils/formatValor.js'

export function EscenarioTrabajoVariable({
  referencia,
  distancia,
  distanciaMeta,
  fuerza,
  velocidad,
  trabajoAplicado,
  trabajoNeto,
  trabajoFriccion,
  tiempoSimulado,
  friccionActiva = false,
  friccionHabilitada = false,
  coeficienteMu,
  onToggleFriccion = () => {},
  enModoInstrucciones,
  mostrarBotonResultados,
  onVerResultados,
}) {
  const recorrido = Number(distancia) || 0
  const objetivo = Math.max(1e-6, Number(distanciaMeta) || 0)
  const progreso = Math.min(1, recorrido / objetivo)
  const pistaAncho = 520
  const posicionCajaPx = progreso * pistaAncho * 0.75
  const texturaAncho = 600
  const offset = -((recorrido * 60) % texturaAncho)

  return (
    <div className="relative h-full overflow-hidden" ref={referencia}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/assets/arenaVariable.jpg)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPositionX: `${offset}px`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/10 to-white/80 pointer-events-none" />

      <div className="relative h-full flex flex-col justify-end">
        <div className="flex-1 flex items-center">
          <img
            src="/assets/cajaTrabajo.jpg"
            alt="Caja"
            className="h-32 transition-transform duración-150 ease-linear"
            style={{ transform: `translate(${posicionCajaPx}px, 60px)` }}
          />
        </div>

        <div className="px-6 pb-5 w-full space-y-2">
          <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duración-150" style={{ width: `${Math.min(progreso * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>0 m</span>
            <span>{formatValor(recorrido)} m / {formatValor(objetivo)} m</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          className={`px-4 py-2 text-xs font-semibold rounded-full shadow-sm transition-colors ${friccionActiva ? 'bg-rose-500 text-white' : 'bg-slate-800/90 text-white'} ${friccionHabilitada ? '' : 'opacity-40 cursor-not-allowed'}`}
          onClick={() => friccionHabilitada && onToggleFriccion()}
          disabled={!friccionHabilitada}
        >
          Fricción {friccionActiva ? 'ON' : 'OFF'} · μ={formatValor(friccionHabilitada ? coeficienteMu : 0)}
        </button>
        <span className="text-[11px] bg-white/80 px-3 py-1 rounded-full text-slate-600 shadow-sm">
          Fuerza proporcional a la distancia
        </span>
      </div>

      {enModoInstrucciones && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="max-w-lg bg-white/90 rounded-xl shadow-card p-4 text-sm text-slate-700">
            Ajusta los parámetros y observa cómo el trabajo depende del tipo de fuerza aplicada y la distancia recorrida.
          </div>
        </div>
      )}

      {mostrarBotonResultados && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button className="btn btn-purple" onClick={onVerResultados}>Ver resultados finales</button>
        </div>
      )}
    </div>
  )
}
