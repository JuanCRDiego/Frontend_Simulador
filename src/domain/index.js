// Base
export { Usuario } from './base/Usuario.js'
export { Estudiante } from './base/Estudiante.js'

// Contenido y niveles
export { ContenidoTematico } from './contenido/ContenidoTematico.js'
export { Nivel, Niveles } from './contenido/Niveles.js'

// Simulación (núcleo)
export { Simulacion } from './simulacion/Simulacion.js'
export { Cronometro } from './simulacion/tiempo/Cronometro.js'
export { Caja } from './simulacion/objetos/Caja.js'
export { Vehiculo } from './simulacion/objetos/Vehiculo.js'
export { Bola } from './simulacion/objetos/Bola.js'
export { Cesped } from './simulacion/superficies/Cesped.js'
export { Pista } from './simulacion/superficies/Pista.js'
export { Edificio } from './simulacion/superficies/Edificio.js'
export { Suelo } from './simulacion/superficies/Suelo.js'
export { FuerzaConstante } from './simulacion/movimiento/FuerzaConstante.js'
export { FuerzaVariable } from './simulacion/movimiento/FuerzaVariable.js'
export { MovimientoCinetico } from './simulacion/movimiento/MovimientoCinetico.js'
export { MovimientoPotencial } from './simulacion/movimiento/MovimientoPotencial.js'
export { MovimientoConservativo } from './simulacion/movimiento/MovimientoConservativo.js'
export { ResultadoSimulacion } from './simulacion/resultados/ResultadoSimulacion.js'
export { TablaResumen } from './simulacion/resultados/TablaResumen.js'
export { InterpretacionResultado } from './simulacion/resultados/InterpretacionResultado.js'
export { GraficosFinales } from './simulacion/resultados/GraficosFinales.js'
export { MetricasFinales } from './simulacion/resultados/MetricasFinales.js'
export { MetricasTiempoReal } from './simulacion/metricas/MetricasTiempoReal.js'
export { MetricaTrabajoFriccion } from './simulacion/metricas/MetricaTrabajoFriccion.js'
export { MetricaEnergiaCinetica } from './simulacion/metricas/MetricaEnergiaCinetica.js'
export { MetricaPotencial } from './simulacion/metricas/MetricaPotencial.js'
export { GraficaTemporal } from './simulacion/graficas/GraficaTemporal.js'

// Parámetros (DTO)
export { ParametrosSimulacion } from './simulacion/parametros/ParametrosSimulacion.js'
export { ParametrosTrabajoConstante } from './simulacion/parametros/ParametrosTrabajoConstante.js'
export { ParametrosTrabajoVariable } from './simulacion/parametros/ParametrosTrabajoVariable.js'
export { ParametrosPotencia } from './simulacion/parametros/ParametrosPotencia.js'
export { ParametrosEnergiaCinetica } from './simulacion/parametros/ParametrosEnergiaCinetica.js'
export { ParametrosFuerzasConservativas } from './simulacion/parametros/ParametrosFuerzasConservativas.js'

// Histórico
export { HistoricoEstudiante } from './historico/HistoricoEstudiante.js'
export {
  Reportes,
  crearReporteEstudiante,
  crearResumenSimulacion as crearReporteResumenSimulacion,
  crearRegistroSimulacion as crearRegistroSimulacionReporte,
  crearParametroSimulacion,
  crearMetricaSimulacion,
  mapearReportesEstudiantes,
  mapearResumenesSimulacion,
  mapearHistorialSimulaciones,
} from './historico/Reportes.js'
