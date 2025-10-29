export class GraficaTemporal {
  constructor({
    titulo,
    tipo = 'linea',
    ejeX = 'Tiempo (s)',
    ejeY = '',
    metrica,
  } = {}) {
    if (!titulo) throw new Error('GraficaTemporal requiere un titulo')
    this.titulo = titulo
    this.tipo = tipo
    this.ejeX = ejeX
    this.ejeY = ejeY
    this.metrica = metrica
    this.datos = new Map()
  }

  actualizar(tiempo, valor) {
    const t = Number(tiempo)
    if (!Number.isFinite(t)) return
    const v = Number(valor) || 0
    this.datos.set(t, v)
    if (this.metrica) this.metrica.agregarValor(t, v)
  }

  renderizar() {
    return Array.from(this.datos.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([x, y]) => ({ x, y }))
  }

  limpiar() {
    this.datos.clear()
    if (this.metrica) this.metrica.limpiar()
  }
}

