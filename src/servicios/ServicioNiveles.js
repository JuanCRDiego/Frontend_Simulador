import { solicitar } from './ClienteApi.js'
import { Nivel } from '../domain/contenido/Niveles.js'

export async function listarNiveles() {
  const respuesta = await solicitar({ ruta: '/niveles', metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return datos.map((item) => Nivel.desdeJSON(item))
}

export async function obtenerNivelPorId(id) {
  if (!id) throw new Error('Se requiere id del nivel.')
  const respuesta = await solicitar({ ruta: `/niveles/${id}`, metodo: 'GET' })
  return Nivel.desdeJSON(respuesta)
}
