export class ParametrosPotencia {
  static ALTURA_MAX = 25

  constructor({
    masaKg = 0,
    alturaM = 0,
    tiempoRapidoS = 0,
    tiempoLentoS = 0,
  } = {}) {
    this.masaKg = Number(masaKg) || 0
    this.alturaM = Number(alturaM) || 0
    this.tiempoRapidoS = Number(tiempoRapidoS) || 0
    this.tiempoLentoS = Number(tiempoLentoS) || 0
  }

  validar() {
    if (!(this.masaKg > 0)) return false
    if (!(this.alturaM > 0 && this.alturaM <= ParametrosPotencia.ALTURA_MAX)) return false
    if (!(this.tiempoRapidoS > 0)) return false
    if (!(this.tiempoLentoS > 0)) return false
    return true
  }

  toJSON() {
    return {
      masaKg: this.masaKg,
      alturaM: this.alturaM,
      tiempoRapidoS: this.tiempoRapidoS,
      tiempoLentoS: this.tiempoLentoS,
    }
  }
}
