import { solicitar } from './ClienteApi.js'
import { ContenidoTematico } from '../domain/contenido/ContenidoTematico.js'

export async function listarTematicas() {
  const respuesta = await solicitar({ ruta: '/contenido', metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return datos.map((item) => ContenidoTematico.desdeJSON(item))
}

export async function crearTematica(datos) {
  const respuesta = await solicitar({
    ruta: '/contenido',
    metodo: 'POST',
    cuerpo: datos,
  })
  return ContenidoTematico.desdeJSON(respuesta)
}

export async function actualizarTematica(id, datos) {
  if (!id) throw new Error('Se requiere id de la temática.')
  const respuesta = await solicitar({
    ruta: `/contenido/${id}`,
    metodo: 'PUT',
    cuerpo: datos,
  })
  return ContenidoTematico.desdeJSON(respuesta)
}

export async function eliminarTematica(id) {
  if (!id) throw new Error('Se requiere id de la temática.')
  return solicitar({
    ruta: `/contenido/${id}`,
    metodo: 'DELETE',
  })
}

export async function listarTematicasPublicas() {
  const respuesta = await solicitar({ ruta: '/contenido/publico', metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return datos.map((item) => ContenidoTematico.desdeJSON(item))
}
