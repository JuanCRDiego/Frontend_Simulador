import { solicitar } from './ClienteApi.js'
import { mapearHistorialSimulaciones } from '../domain/historico/Reportes.js'

export async function guardarResultadoSimulacion({ nivelId, resumen, parametros }) {
  if (!nivelId) throw new Error('Se requiere nivelId para guardar el resultado.')
  return solicitar({
    ruta: `/simulaciones/${nivelId}/resultados`,
    metodo: 'POST',
    cuerpo: { resumen, parametros },
  })
}

export async function obtenerHistorialSimulaciones({ nivelId, usuarioId, limite } = {}) {
  const parametros = new URLSearchParams()
  if (nivelId) parametros.append('nivelId', nivelId)
  if (usuarioId) parametros.append('usuarioId', usuarioId)
  if (limite) parametros.append('limite', limite)

  const query = parametros.toString()
  const ruta = query ? `/simulaciones/historial?${query}` : '/simulaciones/historial'
  const respuesta = await solicitar({ ruta, metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return mapearHistorialSimulaciones(datos)
}

export async function eliminarResultadoSimulacion(id) {
  if (!id) throw new Error('Se requiere el identificador del resultado.')
  return solicitar({
    ruta: `/simulaciones/${id}`,
    metodo: 'DELETE',
  })
}

