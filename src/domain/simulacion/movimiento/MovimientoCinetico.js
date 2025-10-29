export class MovimientoCinetico {
  calcularVelocidadFinal({ velocidadInicial = 0, aceleracion = 0, tiempo = 0 } = {}) {
    const v0 = Number(velocidadInicial) || 0
    const a = Number(aceleracion) || 0
    const t = Number(tiempo) || 0
    return v0 + a * t
  }

  calcularDesplazamiento({ velocidadInicial = 0, aceleracion = 0, tiempo = 0 } = {}) {
    const v0 = Number(velocidadInicial) || 0
    const a = Number(aceleracion) || 0
    const t = Number(tiempo) || 0
    return v0 * t + 0.5 * a * t * t
  }

  calcularImpulso({ fuerza = 0, tiempo = 0 } = {}) {
    const F = Number(fuerza) || 0
    const t = Number(tiempo) || 0
    return F * t
  }

  aplicar(objeto, fuerza, tiempo) {
    const dt = Math.max(0, Number(tiempo) || 0)
    if (!objeto || dt <= 0) {
      return objeto?.snapshot?.() ?? null
    }

    const masa = Math.max(0, Number(objeto.masaKg) || 0)
    const F = Number(fuerza) || 0
    if (!(masa > 0)) return objeto?.snapshot?.() ?? null

    const v0 = Number(objeto.velocidad ?? objeto.velocidadX ?? 0) || 0
    const posicionInicial = Number.isFinite(objeto.posicion) ? Number(objeto.posicion) : 0
    const posicionXInicial = Number.isFinite(objeto.posX) ? Number(objeto.posX) : posicionInicial
    const distanciaInicial = Number.isFinite(objeto.distanciaRecorrida)
      ? Number(objeto.distanciaRecorrida)
      : (Number.isFinite(objeto.posicion) ? Number(objeto.posicion) : posicionXInicial)

    const aceleracion = masa > 0 ? F / masa : 0 // a = F / m
    const desplazamiento = v0 * dt + 0.5 * aceleracion * dt * dt // x = x0 + v0·dt + ½·a·dt²
    const posicionFinal = posicionInicial + desplazamiento
    const velocidadFinal = v0 + aceleracion * dt // v = v0 + a·dt
    const tieneEnergia = Object.prototype.hasOwnProperty.call(objeto, 'energiaCinetica')
    const energiaPrev = tieneEnergia ? (Number(objeto.energiaCinetica) || 0) : 0

    if (Number.isFinite(objeto.posicion)) {
      objeto.posicion = posicionFinal
    }
    if (Number.isFinite(objeto.posX)) {
      objeto.posX = posicionXInicial + desplazamiento
    }
    if (Number.isFinite(objeto.distanciaRecorrida)) {
      objeto.distanciaRecorrida = distanciaInicial + desplazamiento
    }

    objeto.velocidad = velocidadFinal

    const meta = Number(objeto.distanciaMeta)
    if (Number.isFinite(meta) && meta > 0) {
      const referencia = Number.isFinite(objeto.posicion)
        ? objeto.posicion
        : (Number.isFinite(objeto.distanciaRecorrida)
          ? objeto.distanciaRecorrida
          : (Number.isFinite(objeto.posX) ? objeto.posX : NaN))

      if (Number.isFinite(referencia) && referencia >= meta) {
        if (Number.isFinite(objeto.posicion)) objeto.posicion = meta
        if (Number.isFinite(objeto.posX)) objeto.posX = meta
        if (Number.isFinite(objeto.distanciaRecorrida)) objeto.distanciaRecorrida = meta
        if (objeto.velocidad > 0) objeto.velocidad = 0
        if ('completada' in objeto) objeto.completada = true
        if ('completado' in objeto) objeto.completado = true
      }
    }

    const velocidadAjustada = Number(objeto.velocidad) || 0
    const energiaCineticaFinal = 0.5 * masa * velocidadAjustada * velocidadAjustada // K = ½·m·v²
    if (tieneEnergia) {
      objeto.energiaCinetica = energiaCineticaFinal
    }
    const deltaEnergia = energiaCineticaFinal - energiaPrev

    const snapshot = typeof objeto.snapshot === 'function'
      ? objeto.snapshot({
        fuerzaAplicada: F,
        aceleracion,
        desplazamiento,
        deltaEnergiaCinetica: deltaEnergia,
      })
      : undefined

    const posicionResultado = Number.isFinite(objeto.posicion)
      ? objeto.posicion
      : (Number.isFinite(objeto.posX) ? objeto.posX : posicionFinal)
    const velocidadResultado = Number(objeto.velocidad) || 0
    const energiaResultado = tieneEnergia ? (Number(objeto.energiaCinetica) || 0) : energiaCineticaFinal

    return {
      ...(snapshot || {}),
      aceleracion,
      desplazamiento,
      posicionFinal: posicionResultado,
      velocidadFinal: velocidadResultado,
      energiaCinetica: energiaResultado,
      deltaEnergiaCinetica: deltaEnergia,
    }
  }
}
