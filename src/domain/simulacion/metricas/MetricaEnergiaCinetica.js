import { MetricasTiempoReal } from './MetricasTiempoReal.js'

export class MetricaEnergiaCinetica extends MetricasTiempoReal {
  constructor({ unidad = 'J' } = {}) {
    super({ nombre: 'Energia cinetica', unidad })
  }

  calcular(masa, elocidad) {
    const m = Math.max(0, Number(masa) || 0)
    const v = Number(velocidad) || 0
    return 0.5 * m * v * v
  }
}

