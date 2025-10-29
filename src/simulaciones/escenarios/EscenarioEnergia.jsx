import React from 'react'
import { formatValor } from '../utils/formatValor.js'

export function EscenarioEnergia({
  referencia,
  progreso,
  distanciaActual,
  distanciaMeta,
  enModoInstrucciones,
  mostrarBotonResultados,
  onVerResultados,
}) {
  const progresoClamped = Math.min(1, Math.max(0, progreso))
  const texturaAncho = 640
  const offset = -(((distanciaActual || 0) * 60) % texturaAncho)

  return (
    <div className="relative h-full overflow-hidden" ref={referencia}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/assets/pistaCinetica.jpg)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPositionX: `${offset}px`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/15 to-white/70 pointer-events-none" />

      <div className="relative h-full flex flex-col justify-end">
        <div className="flex-1 flex items-center px-10">
          <img
            src="/assets/carro.jpg"
            alt="Vehículo"
            className="h-32 drop-shadow-md transition-transform duration-150 ease-linear"
            style={{ transform: `translate(${progresoClamped * 260}px, 24px)` }}
          />
        </div>

        <div className="px-6 pb-6 space-y-2">
          <div className="h-2 rounded-full bg-slate-200/85 overflow-hidden shadow-inner">
            <div
              className="h-full bg-sky-500 transition-all duración-200"
              style={{ width: `${Math.min(100, progresoClamped * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-200 font-semibold tracking-wide">
            <span>0 m</span>
            <span>{formatValor(distanciaActual)} m / {formatValor(distanciaMeta)} m</span>
          </div>
        </div>
      </div>

      {enModoInstrucciones && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="max-w-lg bg-white/90 rounded-xl shadow-card p-4 text-sm text-slate-700 text-center">
            La energía cinética crece con el cuadrado de la velocidad. Observa cómo aumenta mientras el vehículo recorre la pista.
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
