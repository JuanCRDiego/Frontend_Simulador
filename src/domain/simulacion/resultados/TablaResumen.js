export class TablaResumen {
  constructor({ columnas = [], filas = [] } = {}) {
    this.columnas = Array.isArray(columnas) ? columnas.slice() : []
    this.filas = Array.isArray(filas)
      ? filas.map((row) => (Array.isArray(row) ? row.slice() : [row]))
      : []
  }

  agregarFila(fila) {
    if (!Array.isArray(fila)) return
    this.filas.push(fila.slice())
  }

  establecerColumnas(columnas) {
    if (!Array.isArray(columnas)) return
    this.columnas = columnas.slice()
  }

  eliminarFila(indice) {
    const idx = Number(indice)
    if (!Number.isInteger(idx)) return
    if (idx < 0 || idx >= this.filas.length) return
    this.filas.splice(idx, 1)
  }

  obtenerColumnas() {
    return this.columnas.slice()
  }

  obtenerFilas() {
    return this.filas.map((fila) => fila.slice())
  }

  limpiar() {
    this.filas = []
  }

  toJSON() {
    return {
      columnas: this.obtenerColumnas(),
      filas: this.obtenerFilas(),
    }
  }
}
