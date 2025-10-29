export class MetricasFinales {
  constructor({ nombre = 'finales', valores = new Map() } = {}) {
    this.nombre = nombre
    this.valores = valores instanceof Map ? new Map(valores) : new Map()
  }

  setValor(clave, valor) {
    if (!clave) return
    this.valores.set(clave, valor)
  }

  obtenerValor(clave) {
    return this.valores.get(clave)
  }

  limpiar() {
    this.valores.clear()
  }

  toJSON() {
    return {
      nombre: this.nombre,
      valores: Array.from(this.valores.entries()),
    }
  }
}
