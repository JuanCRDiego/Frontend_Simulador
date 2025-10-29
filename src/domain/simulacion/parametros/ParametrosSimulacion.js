import { ParametrosTrabajoConstante } from './ParametrosTrabajoConstante.js'
import { ParametrosTrabajoVariable } from './ParametrosTrabajoVariable.js'
import { ParametrosPotencia } from './ParametrosPotencia.js'
import { ParametrosEnergiaCinetica } from './ParametrosEnergiaCinetica.js'
import { ParametrosFuerzasConservativas } from './ParametrosFuerzasConservativas.js'

export class ParametrosSimulacion {
  constructor({
    modo = 'trabajo-constante',
    trabajoConstante = {},
    trabajoVariable = {},
    potencia = {},
    energiaCinetica = {},
    fuerzasConservativas = {},
  } = {}) {
    this.modo = modo
    this.trabajoConstante = trabajoConstante instanceof ParametrosTrabajoConstante
      ? trabajoConstante
      : new ParametrosTrabajoConstante(trabajoConstante)
    this.trabajoVariable = trabajoVariable instanceof ParametrosTrabajoVariable
      ? trabajoVariable
      : new ParametrosTrabajoVariable(trabajoVariable)
    this.potencia = potencia instanceof ParametrosPotencia ? potencia : new ParametrosPotencia(potencia)
    this.energia = energiaCinetica instanceof ParametrosEnergiaCinetica
      ? energiaCinetica
      : new ParametrosEnergiaCinetica(energiaCinetica)
    this.fuerzasConservativas = fuerzasConservativas instanceof ParametrosFuerzasConservativas
      ? fuerzasConservativas
      : new ParametrosFuerzasConservativas(fuerzasConservativas)
  }

  conModo(modo) {
    this.modo = modo
    return this
  }

  obtenerTrabajoConstante() {
    return this.trabajoConstante
  }

  obtenerTrabajoVariable() {
    return this.trabajoVariable
  }

  obtenerPotencia() {
    return this.potencia
  }

  obtenerEnergiaCinetica() {
    return this.energia
  }

  obtenerFuerzasConservativas() {
    return this.fuerzasConservativas
  }

  validar() {
    switch (this.modo) {
      case 'trabajo':
      case 'trabajo-constante':
        return this.trabajoConstante.validar()
      case 'trabajo-variable':
        return this.trabajoVariable.validar()
      case 'potencia':
        return this.potencia.validar()
      case 'energia-cinetica':
        return this.energia.validar()
      case 'fuerzas-conservativas':
        return this.fuerzasConservativas.validar()
      default:
        return false
    }
  }
}
