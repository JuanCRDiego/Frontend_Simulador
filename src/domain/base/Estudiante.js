import { Usuario } from './Usuario.js'
import { Niveles } from '../contenido/Niveles.js'
import { HistoricoEstudiante } from '../historico/HistoricoEstudiante.js'

export class Estudiante extends Usuario {
  constructor(props = {}) {
    super(props)
    this.nivelSeleccionado = null
    this._historico = new HistoricoEstudiante()
  }

  static get Historico() { return HistoricoEstudiante }

  // Niveles
  listarNiveles() { return Niveles.list() }
  obtenerNivel(id) { return Niveles.findById(id) }
  seleccionarNivel(id) { this.nivelSeleccionado = this.obtenerNivel(id); return this.nivelSeleccionado }

  obtenerHistorico() { return this._historico }
}
