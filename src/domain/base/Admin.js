import { Usuario } from './Usuario.js'

export class Admin extends Usuario {
  constructor(props = {}) {
    super({ ...props, rol: 'ADMIN' })
  }

  puedeGestionarUsuarios() {
    return true
  }

  puedeGestionarContenido() {
    return true
  }

  puedeVerReportes() {
    return true
  }
}
