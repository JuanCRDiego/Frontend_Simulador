export class Caja {
  constructor({
    identificador,
    masaKg = 0,
    posicion = 0,
    velocidad = 0,
    distanciaMeta = 0,
    rutaImagen = '',
    completada = false,
  } = {}) {
    if (!identificador) throw new Error('Caja requiere un identificador')
    this.identificador = String(identificador)
    this.masaKg = Math.max(0, Number(masaKg) || 0)
    this.posicion = Number(posicion) || 0
    this.velocidad = Number(velocidad) || 0
    this.distanciaMeta = Math.max(0, Number(distanciaMeta) || 0)
    this.rutaImagen = rutaImagen || ''

    this.completada = Boolean(completada)

    this._estadoInicial = {
      posicion: this.posicion,
      velocidad: this.velocidad,
      completada: this.completada,
    }
  }

  reiniciar({
    posicion = this._estadoInicial.posicion,
    velocidad = this._estadoInicial.velocidad,
    completada = this._estadoInicial.completada,
  } = {}) {
    this.posicion = Number(posicion) || 0
    this.velocidad = Number(velocidad) || 0
    this.completada = Boolean(completada)
  }

  snapshot(extra = {}) {
    return {
      id: this.identificador,
      masaKg: this.masaKg,
      posicion: this.posicion,
      velocidad: this.velocidad,
      distanciaMeta: this.distanciaMeta,
      rutaImagen: this.rutaImagen,
      completada: this.completada,
      ...extra,
    }
  }
}
