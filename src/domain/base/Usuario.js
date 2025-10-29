export class Usuario {
  constructor({
    id = null,
    nombre = 'Usuario',
    correo = null,
    email = null,
    rol = 'ESTUDIANTE',
    estado = 'ACTIVO',
  } = {}) {
    this.id = id ?? cryptoRandomId()
    this.nombre = nombre
    const correoNormalizado = correo ?? email
    this.correo = correoNormalizado
    this.email = correoNormalizado
    this.rol = rol
    this.estado = estado
  }

  esAdmin() {
    return this.rol === 'ADMIN'
  }

  esEstudiante() {
    return this.rol === 'ESTUDIANTE'
  }

  tieneRol(rol) {
    if (!rol) return false
    return this.rol === rol
  }

  estaActivo() {
    return this.estado === 'ACTIVO'
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      correo: this.correo,
      rol: this.rol,
      estado: this.estado,
    }
  }
}

function cryptoRandomId() {
  try {
    return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `u_${Math.random().toString(36).slice(2, 10)}`
  } catch {
    return `u_${Math.random().toString(36).slice(2, 10)}`
  }
}
