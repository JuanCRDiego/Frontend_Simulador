export class MetricasTiempoReal {
  constructor({ nombre, unidad = '' } = {}) {
    if (!nombre) throw new Error('MetricasTiempoReal requiere un nombre')
    this.nombre = nombre
    this.unidad = unidad
    this.valores = new Map()
  }

  agregarValor(tiempo, valor) {
    const t = Number(tiempo)
    if (!Number.isFinite(t)) return
    const v = Number(valor) || 0
    this.valores.set(t, v)
  }

  obtenerUltimo() {
    if (this.valores.size === 0) return 0
    const keys = Array.from(this.valores.keys()).sort((a, b) => a - b)
    const lastKey = keys[keys.length - 1]
    return this.valores.get(lastKey)
  }

  limpiar() {
    this.valores.clear()
  }
}

