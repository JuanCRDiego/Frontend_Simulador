import { solicitar } from './ClienteApi.js'
import {
  mapearReportesEstudiantes,
  mapearResumenesSimulacion,
  mapearHistorialSimulaciones,
} from '../domain/historico/Reportes.js'

export async function obtenerReporteEstudiantes() {
  const respuesta = await solicitar({ ruta: '/reportes/estudiantes', metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return mapearReportesEstudiantes(datos)
}

export async function obtenerResumenSimulaciones() {
  const respuesta = await solicitar({ ruta: '/reportes/simulaciones', metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return mapearResumenesSimulacion(datos)
}

export async function obtenerHistorialEstudiante(estudianteId) {
  if (!estudianteId) throw new Error('Debes indicar el estudiante.')
  const respuesta = await solicitar({ ruta: `/simulaciones/estudiantes/${estudianteId}`, metodo: 'GET' })
  const datos = Array.isArray(respuesta?.datos) ? respuesta.datos : []
  return mapearHistorialSimulaciones(datos)
}
