const G = 9.81
const TOLERANCIA_ALTURA = 1e-4

export class MovimientoConservativo {
  constructor({ gravedad = G } = {}) {
    this.gravedad = Number(gravedad) || G
  }

  /**
   * Avanza una integración de caída libre controlada por gravedad.
   * @param {object} opciones
   * @param {object} opciones.objeto Instancia con propiedades {masaKg, altura, velocidad, completada}.
   * @param {number} opciones.deltaTiempo Paso de integración.
   * @param {number} opciones.alturaSuelo Altura de referencia del suelo.
   * @param {object} opciones.contexto Variables acumuladas (trabajo, alturaInicial, etc.).
   * @returns {object} snapshot de estado actualizado.
   */
  avanzar({
    objeto,
    deltaTiempo,
    alturaSuelo = 0,
    contexto = {},
  } = {}) {
    if (!objeto) {
      return {
        altura: 0,
        velocidad: 0,
        trabajoDelta: 0,
        trabajoTotal: contexto.trabajoTotal ?? 0,
        energiaPotencial: 0,
        energiaCinetica: 0,
        completada: true,
      }
    }

    const masa = Math.max(0, Number(objeto.masaKg) || 0)
    let dtRestante = Math.max(0, Number(deltaTiempo) || 0)
    const alturaInicial = Math.max(0, Number(objeto.altura) || 0)
    const velocidadInicial = Number(objeto.velocidad) || 0
    let altura = alturaInicial
    let velocidadFinal = velocidadInicial
    let velocidadImpacto = velocidadInicial
    let trabajoDelta = 0
    const pasoMaximo = Math.max(0.001, Number(contexto.pasoIntegracion) || 0.016)

    while (dtRestante > 0 && !objeto.completada) {
      const paso = Math.min(pasoMaximo, dtRestante)
      const aceleracion = this.gravedad
      const desplazamiento = velocidadFinal * paso + 0.5 * aceleracion * paso * paso // caída con x = x0 + v0·t + ½·g·t²
      const alturaPropuesta = altura - desplazamiento

      if (alturaPropuesta <= alturaSuelo + TOLERANCIA_ALTURA) {
        const caida = Math.max(0, altura - alturaSuelo)
        altura = alturaSuelo
        trabajoDelta += masa * this.gravedad * caida // W_g = m·g·Δh
        velocidadImpacto = Math.sqrt(Math.max(0, velocidadFinal * velocidadFinal + 2 * aceleracion * caida)) // v² = v0² + 2·g·Δh
        velocidadFinal = velocidadImpacto
        objeto.completada = true
      } else {
        altura = alturaPropuesta
        velocidadFinal += aceleracion * paso
        trabajoDelta += masa * this.gravedad * Math.max(0, desplazamiento) // W_g acumulado
      }

      dtRestante -= paso
    }

    const trabajoTotalPrevio = Number(contexto.trabajoTotal) || 0
    const trabajoTotal = trabajoTotalPrevio + trabajoDelta
    contexto.trabajoTotal = trabajoTotal

    objeto.altura = altura
    objeto.velocidad = velocidadFinal
    objeto.trabajoAcumulado = trabajoTotal

    const energiaPotencial = masa * this.gravedad * Math.max(0, altura - alturaSuelo) // U = m·g·h
    const energiaCinetica = 0.5 * masa * velocidadFinal * velocidadFinal // K = ½·m·v²
    const energiaMecanica = energiaPotencial + energiaCinetica // Em = U + K

    return {
      altura,
      velocidad: velocidadFinal,
      trabajoDelta,
      velocidadImpacto,
      trabajoTotal,
      energiaPotencial,
      energiaCinetica,
      energiaMecanica,
      completada: objeto.completada,
    }
  }
}
