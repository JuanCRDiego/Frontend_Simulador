const numero = (valor) => {
  if (valor === null || valor === undefined) return null
  const n = Number(valor)
  return Number.isNaN(n) ? valor : n
}

const normalizarParametros = (parametros) => {
  if (!parametros) return {}
  if (Array.isArray(parametros)) {
    return parametros.reduce((acc, actual = {}) => {
      if (!actual?.nombre) return acc
      acc[actual.nombre] = actual.valor ?? ''
      return acc
    }, {})
  }
  if (typeof parametros === 'object') {
    return Object.entries(parametros).reduce((acc, [clave, valor]) => {
      acc[clave] = valor ?? ''
      return acc
    }, {})
  }
  return {}
}

const normalizarMetricas = (metricas) => {
  if (!Array.isArray(metricas)) return []
  return metricas.map(crearMetricaSimulacion)
}

export function crearReporteEstudiante(dto = {}) {
  return {
    id: numero(dto.id),
    nombre: dto.nombre ?? '',
    correo: dto.correo ?? '',
    rol: dto.rol ?? 'ESTUDIANTE',
    estado: dto.estado ?? 'ACTIVO',
    creadoEn: dto.creadoEn ?? dto.creado_en ?? null,
    actualizadoEn: dto.actualizadoEn ?? dto.actualizado_en ?? null,
  }
}

export function crearResumenSimulacion(dto = {}) {
  return {
    nivelId: numero(dto.nivelId ?? dto.nivel_id),
    tipoSimulacion: dto.tipoSimulacion ?? dto.tipo_simulacion ?? '',
    cantidad: Number.isFinite(Number(dto.cantidad)) ? Number(dto.cantidad) : 0,
  }
}

export function crearParametroSimulacion(nombre, valor) {
  return {
    nombre: nombre ?? '',
    valor: valor ?? '',
  }
}

export function crearMetricaSimulacion(dto = {}) {
  return {
    nombre: dto.nombre ?? dto.id ?? '',
    valor: dto.valor ?? '',
    unidad: dto.unidad ?? null,
  }
}

export function crearRegistroSimulacion(dto = {}) {
  const tipo = dto.tipoSimulacion ?? dto.resumen?.tipo ?? ''
  const interpretacion = dto.interpretacion ?? dto.resumen?.resumenDominio?.interpretacion ?? ''
  const parametrosObjeto = normalizarParametros(dto.parametros)
  const metricas = normalizarMetricas(dto.resumen?.metricasTiempoReal)

  return {
    id: numero(dto.id),
    usuarioId: numero(dto.usuarioId),
    nivelId: numero(dto.nivelId),
    tipoSimulacion: tipo,
    interpretacion,
    fechaEjecucion: dto.fechaEjecucion ?? null,
    creadoEn: dto.creadoEn ?? null,
    parametros: parametrosObjeto,
    parametrosLista: Object.entries(parametrosObjeto).map(([nombre, valor]) => crearParametroSimulacion(nombre, valor)),
    metricas,
    resumen: {
      tipo,
      metricasTiempoReal: metricas,
      resumenDominio: { interpretacion },
    },
  }
}

export function mapearReportesEstudiantes(datos = []) {
  return Array.isArray(datos) ? datos.map(crearReporteEstudiante) : []
}

export function mapearResumenesSimulacion(datos = []) {
  return Array.isArray(datos) ? datos.map(crearResumenSimulacion) : []
}

export function mapearHistorialSimulaciones(datos = []) {
  return Array.isArray(datos) ? datos.map(crearRegistroSimulacion) : []
}

export const Reportes = {
  crearReporteEstudiante,
  crearResumenSimulacion,
  crearRegistroSimulacion,
  crearParametroSimulacion,
  crearMetricaSimulacion,
  mapearReportesEstudiantes,
  mapearResumenesSimulacion,
  mapearHistorialSimulaciones,
}
