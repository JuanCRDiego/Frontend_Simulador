export class MovimientoPotencial {
  constructor({ g = 9.81 } = {}) {
    this.g = Number(g) || 9.81
  }

  calcularAltura(energia, masa) {
    const E = Number(energia) || 0
    const m = Math.max(1e-6, Number(masa) || 0)
    return E / (m * this.g)
  }

  calcularVelocidadCaida({ altura = 0 } = {}) {
    const h = Math.max(0, Number(altura) || 0)
    return Math.sqrt(2 * this.g * h)
  }

  calcularTrabajo({ masa = 0, altura = 0 } = {}) {
    const m = Math.max(0, Number(masa) || 0)
    const h = Number(altura) || 0
    return m * this.g * h
  }

  elevar(objeto, alturaObjetivo, tiempoObjetivo, deltaT) {
    if (!objeto) return null
    const altura = Math.max(0, Number(alturaObjetivo) || 0)
    const tiempo = Math.max(1e-6, Number(tiempoObjetivo) || 1)
    const dt = Math.max(0, Number(deltaT) || 0.01)
    const aceleracion = (2 * altura) / (tiempo * tiempo) // a para alcanzar h en tiempo T 
    const masa = Math.max(0, Number(objeto.masaKg) || 0)
    const fuerzaAplicada = masa * (aceleracion + this.g) // F = m·(a + g) para elevar
    const v0 = Number(objeto.velocidad ?? objeto.velocidadY ?? 0) || 0
    const desplazamiento = v0 * dt + 0.5 * aceleracion * dt * dt // x = x0 + v0·dt + ½·a·dt²
    const velocidadFinal = v0 + aceleracion * dt // v = v0 + a·dt
    const deltaTrabajo = fuerzaAplicada * desplazamiento // W = F·Δx
    const deltaEnergiaPot = masa * this.g * desplazamiento // ΔU = m·g·Δh
    const posInicial = Number(
      objeto.posicion ??
      objeto.posY ??
      0,
    ) || 0
    const posicionFinal = posInicial + desplazamiento

    if (Number.isFinite(objeto.posicion)) {
      objeto.posicion = posicionFinal
    }
    if (Number.isFinite(objeto.posY)) {
      objeto.posY = posicionFinal
    }
    objeto.velocidad = velocidadFinal

    const alturaActual = Number.isFinite(objeto.posicion)
      ? objeto.posicion
      : (Number.isFinite(objeto.posY) ? objeto.posY : posicionFinal)
    const potenciaInst = dt > 0 ? deltaTrabajo / dt : 0 // P = W/Δt
    const velocidadActual = objeto.velocidad
    const velocidadObjetivo = altura / tiempo
    const datos = {
      fuerzaAplicada,
      fuerzaFriccion: 0,
      desplazamiento,
      deltaTrabajo,
      deltaEnergiaPotencial: deltaEnergiaPot,
    }

    return {
      alturaActual,
      velocidadActual,
      deltaTrabajo,
      potenciaInst,
      velocidadObjetivo,
      deltaEnergiaPotencial: deltaEnergiaPot,
      snapshot: typeof objeto.snapshot === 'function'
        ? objeto.snapshot(datos)
        : undefined,
    }
  }
}
