const G = 9.81

export class FuerzaConstante {
  constructor({ nombre = 'Fuerza Constante', fuerzaN = 0 } = {}) {
    this.nombre = nombre
    this.fuerzaN = Number(fuerzaN) || 0
  }

  valor() {
    return this.fuerzaN
  }

  aplicar(objeto, tiempo, { coeficienteFriccion } = {}) {
    const dt = Math.max(0, Number(tiempo) || 0)
    if (!objeto || typeof objeto.masaKg !== 'number' || dt <= 0) return null

    const masa = Math.max(0, Number(objeto.masaKg) || 0)
    if (!(masa > 0)) return null

    const muSuperficie = Number(
      coeficienteFriccion ??
      objeto?.coeficienteFriccion ??
      0,
    ) || 0
    const mu = Math.max(0, muSuperficie)
    const friccionMax = mu * masa * G // F_fric,max = μ·m·g en superficie horizontal
    const vel = Number(objeto.velocidad) || 0
    const pos = Number(objeto.posicion ?? 0) || 0

    let friccion = 0
    let fuerzaNeta = 0
    let aceleracion = 0
    let posicionFinal = pos
    let velocidadFinal = vel

    if (Math.abs(vel) > 1e-6) {
      friccion = -friccionMax * Math.sign(vel)
      fuerzaNeta = this.fuerzaN + friccion
    } else if (Math.abs(this.fuerzaN) <= friccionMax) {
      friccion = -this.fuerzaN
      fuerzaNeta = 0
    } else {
      friccion = -friccionMax * Math.sign(this.fuerzaN || 1)
      fuerzaNeta = this.fuerzaN + friccion
    }

    let desplazamiento = 0
    if (fuerzaNeta !== 0) {
      aceleracion = fuerzaNeta / masa // a = F_neta / m
      const velocidadEstim = vel + aceleracion * dt // v = v0 + a·dt
      if (vel !== 0 && velocidadEstim !== 0 && Math.sign(vel) !== Math.sign(velocidadEstim)) {
        const tiempoHastaDetenerse = Math.min(dt, Math.max(0, -vel / aceleracion))
        desplazamiento = vel * tiempoHastaDetenerse + 0.5 * aceleracion * tiempoHastaDetenerse * tiempoHastaDetenerse // x = x0 + v0·t + ½·a·t²
        posicionFinal = pos + desplazamiento
        velocidadFinal = 0
      } else if (vel === 0 && fuerzaNeta !== 0) {
        posicionFinal = pos + 0.5 * aceleracion * dt * dt
        velocidadFinal = aceleracion * dt
        desplazamiento = posicionFinal - pos
      } else {
        posicionFinal = pos + vel * dt + 0.5 * aceleracion * dt * dt
        velocidadFinal = velocidadEstim
        desplazamiento = posicionFinal - pos
      }
    } else {
      velocidadFinal = 0
      posicionFinal = pos
      desplazamiento = 0
    }

    const deltaTrabajoAplicado = this.fuerzaN * desplazamiento // W = F·Δx
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
      fuerzaAplicada: this.fuerzaN,
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
    const d = Number(distancia) || 0
    return this.fuerzaN * d
  }
}
