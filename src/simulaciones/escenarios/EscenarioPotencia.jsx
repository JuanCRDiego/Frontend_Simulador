import React from 'react'

export function EscenarioPotencia({
  referencia,
  ratioRapido,
  ratioLento,
  enModoInstrucciones,
  mostrarBotonResultados,
  onVerResultados,
}) {
  const columnaAltura = 320
  const cabinaAltura = 96
  const recorridoMax = Math.max(0, columnaAltura - cabinaAltura)
  const ascensoRapidoPx = Math.min(1, Math.max(0, ratioRapido)) * recorridoMax
  const ascensoLentoPx = Math.min(1, Math.max(0, ratioLento)) * recorridoMax

  return (
    <div className="relative h-full overflow-hidden" ref={referencia}>
      <img src="/assets/edificioPontencia.jpg" alt="Edificio" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-900/5 to-transparent" />

      <div className="relative h-full flex items-end justify-between px-20 pb-12">
        <div className="relative flex-1 max-w-[120px]" style={{ height: columnaAltura }}>
          <div className="absolute -left-4 bottom-0 top-0 flex flex-col justify-end w-2 rounded-full bg-white/25 overflow-hidden">
            <div className="w-full bg-emerald-400 transition-all duration-200" style={{ height: `${Math.min(100, ratioRapido * 100)}%` }} />
          </div>
          <img
            src="/assets/caja1_pontencia.jpg"
            alt="Ascensor rápido"
            className="absolute left-1/2 h-24 drop-shadow-md transition-transform duración-200 ease-linear"
            style={{ bottom: '-46px', transform: `translate(28%, ${-ascensoRapidoPx}px)` }}
          />
        </div>

        <div className="relative flex-1 max-w-[120px]" style={{ height: columnaAltura }}>
          <div className="absolute right-[-16px] bottom-0 top-0 flex flex-col justify-end w-2 rounded-full bg-white/25 overflow-hidden">
            <div className="w-full bg-sky-400 transition-all duración-200" style={{ height: `${Math.min(100, ratioLento * 100)}%` }} />
          </div>
          <img
            src="/assets/caja2_pontencia.jpg"
            alt="Ascensor lento"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-24 drop-shadow-md transition-transform duración-200 ease-linear"
            style={{ bottom: '-46px', transform: `translate(-140%, ${-ascensoLentoPx}px)` }}
          />
        </div>
      </div>

      {enModoInstrucciones && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="max-w-lg bg-white/90 rounded-xl shadow-card p-4 text-sm text-slate-700 text-center">
            Realizar el mismo trabajo en menos tiempo implica mayor potencia. Observa cómo ascienden ambos elevadores.
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
