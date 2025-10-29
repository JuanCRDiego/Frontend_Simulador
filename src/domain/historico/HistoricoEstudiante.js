import { Reportes } from './Reportes.js'

export class HistoricoEstudiante {
  constructor() {
    this._reportes = []
  }

  registrarReporte(reporte) {
    if (!reporte) return
    this._reportes.push(reporte)
  }

  listarReportes() {
    return [...this._reportes]
  }

  generarResumen() {
    if (this._reportes.length === 0) return null
    const ultimo = this._reportes[this._reportes.length - 1]
    if (!ultimo || typeof ultimo !== 'object') return { total: this._reportes.length }
    return {
      total: this._reportes.length,
      ultimo,
    }
  }

  static get Reportes() {
    return Reportes
  }
}
