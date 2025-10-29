import { solicitar } from './ClienteApi.js'

export async function listarUsuarios() {
  const respuesta = await solicitar({ ruta: '/usuarios', metodo: 'GET' })
  return respuesta?.datos ?? []
}

export async function crearUsuario({ nombre, correo, clave, rol, estado }) {
  return solicitar({
    ruta: '/usuarios',
    metodo: 'POST',
    cuerpo: { nombre, correo, clave, rol, estado },
  })
}

export async function actualizarUsuario(id, cambios) {
  if (!id) throw new Error('Se requiere el id del usuario.')
  return solicitar({
    ruta: `/usuarios/${id}`,
    metodo: 'PATCH',
    cuerpo: cambios,
  })
}

export async function cambiarEstadoUsuario(id, estado) {
  if (!id) throw new Error('Se requiere el id del usuario.')
  return solicitar({
    ruta: `/usuarios/${id}/estado`,
    metodo: 'PATCH',
    cuerpo: { estado },
  })
}
