import React from 'react'

export function EscenarioCaidaLibre({
  referencia,
  alturaActual,
  imagenFondo = '/assets/sueloConservativo.png',
  imagenBola = '/assets/bolaConservativa.png',
  mostrarBotonResultados,
  onVerResultados,
}) {
  const ALTURA_MAX_ESCENA = 20
  const ALTURA_ESCENA_PX = 320
  const RADIO_ESFERA_PX = 30

  const alturaClamped = Math.max(0, Math.min(alturaActual ?? 0, ALTURA_MAX_ESCENA))
  const progreso = ALTURA_MAX_ESCENA > 0 ? alturaClamped / ALTURA_MAX_ESCENA : 0
  const bottomPx = RADIO_ESFERA_PX + progreso * (ALTURA_ESCENA_PX - RADIO_ESFERA_PX)

  return (
    <div
      ref={referencia}
      className="relative h-full overflow-hidden"
      style={{
        backgroundImage: `url(${imagenFondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <img
        src={imagenBola}
        alt="Esfera en caída libre"
        className="absolute h-18 w-18 md:h-20 md:w-20 rounded-full drop-shadow-xl transition-transform duration-200 ease-linear pointer-events-none"
        style={{
          left: '50%',
          bottom: `${bottomPx}px`,
          transform: 'translate(-50%, 0)',
        }}
      />

      {mostrarBotonResultados && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button className="btn btn-purple" onClick={onVerResultados}>
            Ver resultados finales
          </button>
        </div>
      )}
    </div>
  )
}
