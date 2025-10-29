export class ParametrosEnergiaCinetica {
  constructor({
    masaKg = 0,
    velocidadFinalMs = 0,
    distanciaMetaM = 0,
  } = {}) {
    this.masaKg = Number(masaKg) || 0
    this.velocidadFinalMs = Number(velocidadFinalMs) || 0
    this.distanciaMetaM = Number(distanciaMetaM) || 0
  }

  validar() {
    if (!(this.masaKg > 0)) return false
    if (!(this.velocidadFinalMs > 0)) return false
    if (!(this.distanciaMetaM > 0)) return false
    return true
  }

  toJSON() {
    return {
      masaKg: this.masaKg,
      velocidadFinalMs: this.velocidadFinalMs,
      distanciaMetaM: this.distanciaMetaM,
    }
  }
}

