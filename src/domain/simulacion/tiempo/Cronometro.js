export class Cronometro {
  constructor() {
    this.tiempoSegundos = 0
    this._corriendo = false
  }

  reiniciar() {
    this.tiempoSegundos = 0
    this._corriendo = false
  }

  iniciar() {
    this._corriendo = true
  }

  detener() {
    this._corriendo = false
  }

  avanzar(delta) {
    const dt = Math.max(0, Number(delta) || 0)
    if (!this._corriendo || dt <= 0) return this.tiempoSegundos
    this.tiempoSegundos += dt
    return this.tiempoSegundos
  }

  obtenerTiempo() {
    return this.tiempoSegundos
  }

  estaCorriendo() {
    return this._corriendo
  }
}

