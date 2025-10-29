export class ParametrosTrabajoVariable {
  constructor({
    masaKg = 0,
    k = 0,
    distanciaMetaM = 0,
    friccionActiva = false,
    coeficienteMu = 0,
    offsetN = 0.1,
  } = {}) {
    this.masaKg = Number(masaKg) || 0
    this.k = Number(k) || 0
    this.distanciaMetaM = Number(distanciaMetaM) || 0
    this.friccionActiva = Boolean(friccionActiva)
    this.coeficienteMu = Number(coeficienteMu) || 0
    const offsetNormalizado = Number(offsetN)
    this.offsetN = Number.isFinite(offsetNormalizado) ? offsetNormalizado : 0.1
  }

  validar() {
    if (!(this.masaKg > 0)) return false
    if (!(this.distanciaMetaM > 0)) return false
    if (!(this.k >= 0) || !Number.isFinite(this.k)) return false
    if (this.friccionActiva && !(this.coeficienteMu >= 0)) return false
    return true
  }

  toJSON() {
    return {
      masaKg: this.masaKg,
      k: this.k,
      distanciaMetaM: this.distanciaMetaM,
      friccionActiva: this.friccionActiva,
      coeficienteMu: this.coeficienteMu,
      offsetN: this.offsetN,
    }
  }
}
