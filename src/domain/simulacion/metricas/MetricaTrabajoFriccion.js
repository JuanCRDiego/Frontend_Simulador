import { MetricasTiempoReal } from './MetricasTiempoReal.js'

export class MetricaTrabajoFriccion extends MetricasTiempoReal {
  constructor({ unidad = 'J' } = {}) {
    super({ nombre: 'Trabajo con friccion', unidad })
  }

  calcular(distancia, fuerza, friccion) {
    const d = Number(distancia) || 0
    const F = Number(fuerza) || 0
    const Ff = Number(friccion) || 0
    return (F - Ff) * d
  }
}
