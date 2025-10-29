import React from 'react'
import { formatValor } from '../utils/formatValor.js'

export function PanelEstado({ metricas = [], acciones }) {
  const pausar = acciones?.pausar ?? (() => {})
  const reanudar = acciones?.reanudar ?? (() => {})
  const reiniciar = acciones?.reiniciar ?? (() => {})

  return (
    <div className="grid gap-3">
      <div className="card text-sm space-y-1">
        <h3 className="text-slate-800 font-semibold">Métricas</h3>
        {metricas.map(({ etiqueta, valor, unidad }) => (
          <div key={etiqueta} className="flex justify-between">
            <span>{etiqueta}:</span>
            <span className="font-semibold text-slate-800">
              {formatValor(valor)} {unidad}
            </span>
          </div>
        ))}
      </div>
      <div className="card grid gap-2">
        <h4 className="font-semibold text-slate-800">Controles</h4>
        <button className="btn btn-outline" onClick={pausar}>Pausar</button>
        <button className="btn btn-green" onClick={reanudar}>Reanudar</button>
        <button className="btn btn-purple" onClick={reiniciar}>Reiniciar</button>
      </div>
    </div>
  )
}
