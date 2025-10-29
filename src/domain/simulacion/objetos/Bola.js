export class Bola {
  constructor({
    identificador,
    masaKg = 0,
    altura = 0,
    velocidad = 0,
    rutaImagen = '',
    trabajoAcumulado = 0,
    completada = false,
  } = {}) {
    if (!identificador) throw new Error('Bola requiere un identificador')

    this.identificador = String(identificador)
    this.masaKg = Math.max(0, Number(masaKg) || 0)
    this.altura = Math.max(0, Number(altura) || 0)
    this.velocidad = Number(velocidad) || 0
    this.rutaImagen = rutaImagen || ''
    this.trabajoAcumulado = Number(trabajoAcumulado) || 0
    this.completada = Boolean(completada)

    this._estadoInicial = {
      altura: this.altura,
      velocidad: this.velocidad,
      trabajoAcumulado: this.trabajoAcumulado,
      completada: this.completada,
    }
  }

  reiniciar({
    altura = this._estadoInicial.altura,
    velocidad = this._estadoInicial.velocidad,
    trabajoAcumulado = this._estadoInicial.trabajoAcumulado,
    completada = this._estadoInicial.completada,
  } = {}) {
    this.altura = Math.max(0, Number(altura) || 0)
    this.velocidad = Number(velocidad) || 0
    this.trabajoAcumulado = Number(trabajoAcumulado) || 0
    this.completada = Boolean(completada)
  }

  snapshot(extra = {}) {
    return {
      id: this.identificador,
      masaKg: this.masaKg,
      altura: this.altura,
      velocidad: this.velocidad,
      trabajoAcumulado: this.trabajoAcumulado,
      completada: this.completada,
      ...extra,
    }
  }
}
