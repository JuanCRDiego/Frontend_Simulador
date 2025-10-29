export class GraficosFinales {
  constructor({
    titulo = '',
    tipo = 'linea',
    ejeX = '',
    ejeY = '',
    datos = [],
  } = {}) {
    this.titulo = titulo
    this.tipo = tipo
    this.ejeX = ejeX
    this.ejeY = ejeY
    this.datos = Array.isArray(datos) ? datos.map((punto) => ({ ...punto })) : []
  }

  agregarDato(punto) {
    if (!punto || typeof punto !== 'object') return
    this.datos.push({ ...punto })
  }

  limpiar() {
    this.datos = []
  }
}
