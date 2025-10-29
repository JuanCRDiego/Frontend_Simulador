import { Admin } from './Admin.js'
import { Estudiante } from './Estudiante.js'
import { Usuario } from './Usuario.js'

export function crearUsuarioDesdeDatos(datos = {}) {
  if (!datos || typeof datos !== 'object') {
    return null
  }
  const estadoNormalizado = typeof datos.estado === 'string'
    ? datos.estado
    : (typeof datos.estaActivo === 'boolean'
      ? (datos.estaActivo ? 'ACTIVO' : 'INACTIVO')
      : 'ACTIVO')
  const base = {
    id: datos.id ?? datos.usuarioId ?? null,
    nombre: datos.nombre ?? datos.fullName ?? '',
    correo: datos.correo ?? datos.email ?? null,
    rol: datos.rol ?? 'ESTUDIANTE',
    estado: estadoNormalizado,
    grado: datos.grado ?? null,
    grupo: datos.grupo ?? null,
  }

  if (base.rol === 'ADMIN') return new Admin(base)
  if (base.rol === 'ESTUDIANTE') return new Estudiante(base)
  return new Usuario(base)
}
