export class ParametrosFuerzasConservativas {
  constructor({
    masaKg = 0,
    alturaInicialM = 0,
    velocidadInicialMs = 0,
    rutaBola = null,
    rutaSuelo = null,
  } = {}) {
    this.masaKg = Number(masaKg) || 0
    this.alturaInicialM = Math.max(0, Number(alturaInicialM) || 0)
    this.velocidadInicialMs = Number(velocidadInicialMs) || 0
    this.rutaBola = rutaBola || null
    this.rutaSuelo = rutaSuelo || null
  }

  validar() {
    if (!(this.masaKg > 0)) return false
    if (!(this.alturaInicialM >= 0)) return false
    return true
  }

  toJSON() {
    return {
      masaKg: this.masaKg,
      alturaInicialM: this.alturaInicialM,
      velocidadInicialMs: this.velocidadInicialMs,
      rutaBola: this.rutaBola,
      rutaSuelo: this.rutaSuelo,
    }
  }
}
