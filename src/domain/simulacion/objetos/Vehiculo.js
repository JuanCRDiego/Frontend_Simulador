export class Vehiculo {
  constructor({
    identificador,
    masaKg = 0,
    posX = 0,
    posY = 0,
    velocidad = 0,
    distanciaMeta = 0,
    rutaImagen = '',
    distanciaRecorrida = 0,
    energiaCinetica = 0,
    completado = false,
  } = {}) {
    if (!identificador) throw new Error('Vehiculo requiere un identificador')
    this.identificador = String(identificador)
    this.masaKg = Math.max(0, Number(masaKg) || 0)
    this.posX = Number(posX) || 0
    this.posY = Number(posY) || 0
    this.velocidad = Number(velocidad) || 0
    this.distanciaMeta = Math.max(0, Number(distanciaMeta) || 0)
    this.rutaImagen = rutaImagen || ''

    this.distanciaRecorrida = Number(distanciaRecorrida) || 0
    this.energiaCinetica = Number(energiaCinetica) || 0
    this.completado = Boolean(completado)

    this._historial = []
    this._estadoInicial = {
      posX: this.posX,
      posY: this.posY,
      velocidad: this.velocidad,
      distanciaRecorrida: this.distanciaRecorrida,
      energiaCinetica: this.energiaCinetica,
      completado: this.completado,
    }
  }

  reiniciar({
    posX = this._estadoInicial.posX,
    posY = this._estadoInicial.posY,
    velocidad = this._estadoInicial.velocidad,
  } = {}) {
    this.posX = Number(posX) || 0
    this.posY = Number(posY) || 0
    this.velocidad = Number(velocidad) || 0
    this.distanciaRecorrida = Number(this._estadoInicial.distanciaRecorrida) || 0
    this.energiaCinetica = Number(this._estadoInicial.energiaCinetica) || 0
    this.completado = Boolean(this._estadoInicial.completado)
    this._historial = []
  }

  actualizarEstado({
    posX,
    posY,
    desplazamientoX,
    distanciaRecorrida,
    deltaDistanciaRecorrida,
    velocidad,
    energiaCinetica,
    deltaEnergiaCinetica,
    completado,
    fuerzaAplicada,
  } = {}) {
    if (typeof posX === 'number' && Number.isFinite(posX)) {
      this.posX = posX
    } else if (typeof desplazamientoX === 'number' && Number.isFinite(desplazamientoX)) {
      this.posX += desplazamientoX
    }

    if (typeof posY === 'number' && Number.isFinite(posY)) {
      this.posY = posY
    }

    if (typeof distanciaRecorrida === 'number' && Number.isFinite(distanciaRecorrida)) {
      this.distanciaRecorrida = distanciaRecorrida
    } else if (typeof deltaDistanciaRecorrida === 'number' && Number.isFinite(deltaDistanciaRecorrida)) {
      this.distanciaRecorrida += deltaDistanciaRecorrida
    } else if (typeof desplazamientoX === 'number' && Number.isFinite(desplazamientoX)) {
      this.distanciaRecorrida += desplazamientoX
    }

    if (typeof velocidad === 'number' && Number.isFinite(velocidad)) {
      this.velocidad = velocidad
    }

    if (typeof energiaCinetica === 'number' && Number.isFinite(energiaCinetica)) {
      this.energiaCinetica = energiaCinetica
    } else if (typeof deltaEnergiaCinetica === 'number' && Number.isFinite(deltaEnergiaCinetica)) {
      this.energiaCinetica += deltaEnergiaCinetica
    }

    if (this.distanciaMeta > 0 && this.distanciaRecorrida >= this.distanciaMeta) {
      this.distanciaRecorrida = this.distanciaMeta
      this.posX = this.distanciaMeta
      this.completado = true
    }

    if (typeof completado === 'boolean') {
      this.completado = completado
    }

    this._historial.push({
      tiempo: Date.now(),
      posX: this.posX,
      posY: this.posY,
      velocidad: this.velocidad,
      distanciaRecorrida: this.distanciaRecorrida,
      energiaCinetica: this.energiaCinetica,
      completado: this.completado,
      fuerzaAplicada: typeof fuerzaAplicada === 'number' ? fuerzaAplicada : undefined,
    })

    return this.snapshot({
      fuerzaAplicada: typeof fuerzaAplicada === 'number' ? fuerzaAplicada : undefined,
    })
  }

  historial() {
    return this._historial.slice()
  }

  snapshot(extra = {}) {
    return {
      id: this.identificador,
      masaKg: this.masaKg,
      posX: this.posX,
      posY: this.posY,
      velocidad: this.velocidad,
      distanciaMeta: this.distanciaMeta,
      distanciaRecorrida: this.distanciaRecorrida,
      energiaCinetica: this.energiaCinetica,
      completado: this.completado,
      ...extra,
    }
  }
}

