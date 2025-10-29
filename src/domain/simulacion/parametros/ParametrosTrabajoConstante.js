export class ParametrosTrabajoConstante {
  constructor({
    masaKg = 0,
    fuerzaN = 0,
    distanciaMetaM = 0,
    friccionActiva = false,
    coeficienteMu = 0,
  } = {}) {
    this.masaKg = Number(masaKg) || 0
    this.fuerzaN = Number(fuerzaN) || 0
    this.distanciaMetaM = Number(distanciaMetaM) || 0
    this.friccionActiva = Boolean(friccionActiva)
    this.coeficienteMu = Number(coeficienteMu) || 0
  }

  validar() {
    if (!(this.masaKg > 0)) return false
    if (!(this.distanciaMetaM > 0)) return false
    if (!Number.isFinite(this.fuerzaN)) return false
    if (this.friccionActiva && !(this.coeficienteMu >= 0)) return false
    return true
  }

  toJSON() {
    return {
      masaKg: this.masaKg,
      fuerzaN: this.fuerzaN,
      distanciaMetaM: this.distanciaMetaM,
      friccionActiva: this.friccionActiva,
      coeficienteMu: this.coeficienteMu,
    }
  }
}
