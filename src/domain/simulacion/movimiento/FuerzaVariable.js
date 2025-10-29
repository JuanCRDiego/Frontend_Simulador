const G = 9.81

export class FuerzaVariable {
  constructor({
    nombre = 'Fuerza Variable',
    k = 0,
    offsetN = 0.1,
  } = {}) {
    this.nombre = nombre
    this.k = Number(k) || 0
    this.offsetN = Number(offsetN) || 0
  }

  establecerOffset(valor) {
    this.offsetN = Number(valor) || 0
  }

  valor(distancia = 0) {
    const x = Math.max(0, Number(distancia) || 0)
    return this.offsetN + this.k * x
  }

  aplicar(objeto, tiempo, { coeficienteFriccion, posicion } = {}) {
    const dt = Math.max(0, Number(tiempo) || 0)
    if (!objeto || typeof objeto.masaKg !== 'number' || dt <= 0) return null

    const masa = Math.max(0, Number(objeto.masaKg) || 0)
    if (!(masa > 0)) return null

    const posicionReferencia = Math.max(0, Number(typeof posicion === 'number' ? posicion : objeto?.posicion ?? 0) || 0)
    const fuerzaAplicada = this.valor(posicionReferencia) // F(x) = F0 + k·x
    const muSuperficie = Number(
      coeficienteFriccion ??
      objeto?.coeficienteFriccion ??
      0,
    ) || 0
    const mu = Math.max(0, muSuperficie)
    const friccionMax = mu * masa * G // F_fric,max = μ·m·g
    const vel = Number(objeto.velocidad) || 0

    let friccion = 0
    let fuerzaNeta = 0
    let aceleracion = 0
    const posicionBase = Number(objeto.posicion ?? 0) || 0
    let posicionFinal = posicionBase
    let velocidadFinal = vel

    if (Math.abs(vel) > 1e-6) {
      friccion = -friccionMax * Math.sign(vel)
      fuerzaNeta = fuerzaAplicada + friccion
    } else if (Math.abs(fuerzaAplicada) <= friccionMax) {
      friccion = -fuerzaAplicada
      fuerzaNeta = 0
    } else {
      friccion = -friccionMax * Math.sign(fuerzaAplicada || 1)
      fuerzaNeta = fuerzaAplicada + friccion
    }

    let desplazamiento = 0
    if (fuerzaNeta !== 0) {
      aceleracion = fuerzaNeta / masa // a = F_neta / m
      const velocidadEstim = vel + aceleracion * dt // v = v0 + a·dt
      if (vel !== 0 && velocidadEstim !== 0 && Math.sign(vel) !== Math.sign(velocidadEstim)) {
        const tiempoHastaDetenerse = Math.min(dt, Math.max(0, -vel / aceleracion))
        desplazamiento = vel * tiempoHastaDetenerse + 0.5 * aceleracion * tiempoHastaDetenerse * tiempoHastaDetenerse // x = x0 + v0·t + ½·a·t²
        posicionFinal = posicionBase + desplazamiento
        velocidadFinal = 0
      } else if (vel === 0 && fuerzaNeta !== 0) {
        posicionFinal = posicionBase + 0.5 * aceleracion * dt * dt
        velocidadFinal = aceleracion * dt
        desplazamiento = posicionFinal - posicionBase
      } else {
        posicionFinal = posicionBase + vel * dt + 0.5 * aceleracion * dt * dt
        velocidadFinal = velocidadEstim
        desplazamiento = posicionFinal - posicionBase
      }
    } else {
      velocidadFinal = 0
      posicionFinal = posicionBase
      desplazamiento = 0
    }

    const deltaTrabajoAplicado = fuerzaAplicada * desplazamiento // W = F(x)·Δx
    const deltaTrabajoFriccion = friccion * desplazamiento // W_fric = F_fric·Δx
    let velocidadInstantanea = velocidadFinal

    let completada = false
    if (typeof objeto.distanciaMeta === 'number' && objeto.distanciaMeta > 0 && posicionFinal >= objeto.distanciaMeta) {
      posicionFinal = objeto.distanciaMeta
      completada = true
      if (velocidadFinal > 0) {
        velocidadInstantanea = velocidadFinal
        velocidadFinal = 0
      }
    }

    objeto.posicion = posicionFinal
    objeto.velocidad = velocidadFinal
    if ('completada' in objeto) {
      objeto.completada = objeto.completada || completada
    } else if (completada) {
      objeto.completada = true
    }

    const datos = {
      fuerzaAplicada,
      fuerzaFriccion: friccion,
      fuerzaNeta,
      aceleracion,
      desplazamiento,
      deltaTrabajoAplicado,
      deltaTrabajoFriccion,
      velocidadInstantanea,
    }

    if (typeof objeto.snapshot === 'function') {
      return objeto.snapshot(datos)
    }

    return {
      posicion: posicionFinal,
      velocidad: velocidadInstantanea,
      completada: Boolean(objeto.completada),
      ...datos,
    }
  }

  calcularTrabajo(distancia) {
    const x = Number(distancia) || 0
    return 0.5 * this.k * x * x
  }
}
