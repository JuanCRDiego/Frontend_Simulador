import { MetricasTiempoReal } from './MetricasTiempoReal.js'

export class MetricaPotencial extends MetricasTiempoReal {
  constructor({ unidad = 'J', g = 9.81 } = {}) {
    super({ nombre: 'Energia potencial', unidad })
    this.g = Number(g) || 9.81
  }

  calcular(altura, masa) {
    const h = Number(altura) || 0
    const m = Math.max(0, Number(masa) || 0)
    return m * this.g * h
  }
}

