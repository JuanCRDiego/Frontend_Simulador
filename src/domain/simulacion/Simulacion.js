// La clase Simulacion concentra el estado físico. Es instanciada desde las de `SimulacionGeneral.jsx`, y la plantilla de UI (`PlantillaSimulacion.jsx`) invoca sus métodos de ciclo de vida (configurar/iniciar/actualizar/finalizar).
import { Cronometro } from './tiempo/Cronometro.js'
import { Caja } from './objetos/Caja.js'
import { Vehiculo } from './objetos/Vehiculo.js'
import { Bola } from './objetos/Bola.js'
import { Cesped } from './superficies/Cesped.js'
import { Pista } from './superficies/Pista.js'
import { Edificio } from './superficies/Edificio.js'
import { Suelo } from './superficies/Suelo.js'
import { FuerzaConstante } from './movimiento/FuerzaConstante.js'
import { FuerzaVariable } from './movimiento/FuerzaVariable.js'
import { MovimientoCinetico } from './movimiento/MovimientoCinetico.js'
import { MovimientoPotencial } from './movimiento/MovimientoPotencial.js'
import { MovimientoConservativo } from './movimiento/MovimientoConservativo.js'
import { ResultadoSimulacion } from './resultados/ResultadoSimulacion.js'
import { InterpretacionResultado } from './resultados/InterpretacionResultado.js'
import { MetricasTiempoReal } from './metricas/MetricasTiempoReal.js'
import { GraficaTemporal } from './graficas/GraficaTemporal.js'
import { ParametrosSimulacion } from './parametros/ParametrosSimulacion.js'

const G = 9.81

export const ESTADO_SIMULACION = Object.freeze({
  Configurando: 'configurando',
  Corriendo: 'corriendo',
  Pausada: 'pausada',
  Finalizada: 'finalizada',
})

export class Simulacion {
  constructor({ tipo = 'trabajo-constante', parametros = null } = {}) {
    this.tipo = tipo
    this.parametros = parametros instanceof ParametrosSimulacion
      ? parametros
      : new ParametrosSimulacion({ modo: tipo, ...(parametros || {}) })

    this.estado = ESTADO_SIMULACION.Configurando
    this.cronometro = new Cronometro()
    this.resultado = new ResultadoSimulacion()

    this.cajas = []
    this.vehiculos = []
    this.bolas = []
    this.cesped = null
    this.pista = null
    this.edificio = null
    this.suelo = null
    this.fuerzaConstante = new FuerzaConstante()
    this.fuerzaVariable = new FuerzaVariable()
    this.movimientoCinetico = new MovimientoCinetico()
    this.movimientoPotencial = new MovimientoPotencial({})
    this.movimientoConservativo = new MovimientoConservativo({})

    this.metricas = new Map()
    this.graficas = new Map()

    this._contextoTrabajo = null
    this._contextoTrabajoConstante = null
    this._contextoTrabajoVariable = null
    this._contextoPotencia = null
    this._contextoEnergia = null
    this._contextoConservativo = null
    this._friccionActiva = false
    this._estadoAntesFriccion = null
    this._ultimoTipoResumen = null
  }

  // Utilidad usada en las interpretaciones para mostrar números en la UI.
  _formatearNumero(valor, decimales = 2) {
    const numero = Number(valor)
    if (!Number.isFinite(numero)) return '0'
    return numero.toFixed(decimales)
  }

  // Crea el objeto `InterpretacionResultado` almacenado en `resultado`. Plantilla y la vista de resultados lo leen al cerrar la simulación.
  _actualizarInterpretacion(texto) {
    if (!texto) return
    this.resultado.interpretacion = new InterpretacionResultado({ texto })
  }

  // Variante segura para actualizar solo el texto manteniendo la instancia
  // original; se invoca al finalizar cada modo (_registrarResumen...).
  _actualizarInterpretacionSegura(texto) {
    try {
      if (!texto || typeof texto !== 'string' || !texto.trim()) return
      if (this.resultado.interpretacion instanceof InterpretacionResultado) {
        this.resultado.interpretacion.texto = texto.trim()
      } else if (
        this.resultado.interpretacion &&
        typeof this.resultado.interpretacion === 'object' &&
        Object.prototype.hasOwnProperty.call(this.resultado.interpretacion, 'texto')
      ) {
        this.resultado.interpretacion.texto = texto.trim()
      } else {
        this._actualizarInterpretacion(texto.trim())
      }
    } catch (error) {
      console.warn('No se pudo generar la interpretación personalizada.', error)
    }
  }

  // --- Utilidades generales -------------------------------------------------


  // Vacía las colecciones de objetos físicos.
  limpiarObjetos() {
    this.cajas = []
    this.vehiculos = []
    this.bolas = []
  }

  // Restablece las estructuras de métricas y gráficas. 
  resetVisualizaciones() {
    this.metricas = new Map()
    this.graficas = new Map()
  }

  // Registra una métrica temporal con un identificador
  registrarMetrica(id, config) {
    if (!id) return null
    const metrica = config instanceof MetricasTiempoReal ? config : new MetricasTiempoReal(config)
    this.metricas.set(id, metrica)
    return metrica
  }

  // Registra una gráfica temporal. Más adelante `actualizarGrafica` empuja datos y la plantilla las renderiza en los paneles de resultados.
  registrarGrafica(id, config) {
    if (!id) return null
    const grafica = config instanceof GraficaTemporal ? config : new GraficaTemporal(config)
    this.graficas.set(id, grafica)
    return grafica
  }

  // Actualiza una métrica temporal con un nuevo valor en el tiempo indicado.
  actualizarMetrica(id, tiempo, valor) {
    const metrica = this.metricas.get(id)
    if (!metrica) return
    metrica.agregarValor(Number(tiempo) || 0, Number(valor) || 0)
  }

  // Actualiza una gráfica temporal con un nuevo valor en el tiempo indicado.
  actualizarGrafica(id, tiempo, valor) {
    const grafica = this.graficas.get(id)
    if (!grafica) return
    grafica.actualizar(Number(tiempo) || 0, Number(valor) || 0)
  }


// ---------------------------------------------------------------------------
// Creación de objetos físicos    Invocado por los métodos de configuración para agregar cajas, vehículos y esferas.
// ---------------------------------------------------------------------------

  agregarCaja(config) {
    const caja = config instanceof Caja ? config : new Caja(config)
    this.cajas.push(caja)
    return caja
  }

  agregarVehiculo(config) {
    const vehiculo = config instanceof Vehiculo ? config : new Vehiculo(config)
    this.vehiculos.push(vehiculo)
    return vehiculo
  }

  agregarBola(config) {
    const bola = config instanceof Bola ? config : new Bola(config)
    this.bolas.push(bola)
    return bola
  }

// ---------------------------------------------------------------------------
// Configuración de entorno y superficies   cada configuración decide cuáles superficies activar para que la UI pueda renderizar el escenario adecuado.
// ---------------------------------------------------------------------------

  establecerSuperficieCesped(config) {
    this.cesped = config instanceof Cesped ? config : new Cesped(config || {})
    return this.cesped
  }

  establecerSuperficiePista(config) {
    this.pista = config instanceof Pista ? config : new Pista(config || {})
    return this.pista
  }

  establecerEdificio(config) {
    this.edificio = config instanceof Edificio ? config : new Edificio(config || {})
    return this.edificio
  }

  establecerSuperficieSuelo(config) {
    this.suelo = config instanceof Suelo ? config : new Suelo(config || {})
    return this.suelo
  }

  // configuracion de movimientos de los objetos físicos

  establecerFuerzaConstante(config) {
    if (config instanceof FuerzaConstante) {
      this.fuerzaConstante = config
    } else if (config && typeof config === 'object') {
      if (Object.prototype.hasOwnProperty.call(config, 'fuerzaN')) {
        this.fuerzaConstante.fuerzaN = Number(config.fuerzaN) || 0
      }
      if (Object.prototype.hasOwnProperty.call(config, 'nombre')) {
        this.fuerzaConstante.nombre = String(config.nombre)
      }
    }
    return this.fuerzaConstante
  }

  establecerFuerzaVariable(config) {
    if (config instanceof FuerzaVariable) {
      this.fuerzaVariable = config
    } else if (config && typeof config === 'object') {
      if (Object.prototype.hasOwnProperty.call(config, 'k')) {
        this.fuerzaVariable.k = Number(config.k) || 0
      }
      if (Object.prototype.hasOwnProperty.call(config, 'nombre')) {
        this.fuerzaVariable.nombre = String(config.nombre)
      }
      if (Object.prototype.hasOwnProperty.call(config, 'offsetN')) {
        const offset = Number(config.offsetN)
        if (Number.isFinite(offset)) {
          this.fuerzaVariable.establecerOffset(offset)
        }
      }
    }
    return this.fuerzaVariable
  }


// ---------------------------------------------------------------------------
// Configuración por modo   Invocado por `SimulacionGeneral` cuando el usuario elige el modo. Prepara la escena, métricas y estado interno.
// ---------------------------------------------------------------------------

// Configura el modo “trabajo constante”
  configurarTrabajoConstante({ parametrosTrabajo } = {}) {
    const dto = parametrosTrabajo || this.parametros?.obtenerTrabajoConstante?.()
    const config = dto?.toJSON ? dto.toJSON() : dto || {}

    const masaKg = Number(config.masaKg) || 0
    const distanciaMeta = Number(config.distanciaMetaM) || 0
    const fuerzaN = Number(config.fuerzaN) || 0
    const coeficienteMu = Number(config.coeficienteMu) || 0

    this.parametros?.conModo?.('trabajo-constante')
    this.tipo = 'trabajo-constante'
    this.estado = ESTADO_SIMULACION.Configurando
    this.limpiarObjetos()
    this.resetVisualizaciones()

    this.establecerSuperficieCesped({})
    const caja = this.agregarCaja({
      identificador: 'caja-trabajo-constante',
      masaKg,
      distanciaMeta,
    })
    if (caja) caja.coeficienteFriccion = 0

    this.registrarMetrica('tiempo', new MetricasTiempoReal({ nombre: 'Tiempo', unidad: 's' }))
    this.registrarMetrica('trabajo_aplicado', new MetricasTiempoReal({ nombre: 'Trabajo aplicado', unidad: 'J' }))
    this.registrarMetrica('trabajo_friccion', new MetricasTiempoReal({ nombre: 'Trabajo fricción', unidad: 'J' }))
    this.registrarMetrica('trabajo_neto', new MetricasTiempoReal({ nombre: 'Trabajo neto', unidad: 'J' }))
    this.registrarMetrica('fuerza_actual', new MetricasTiempoReal({ nombre: 'Fuerza', unidad: 'N' }))
    this.registrarMetrica('distancia', new MetricasTiempoReal({ nombre: 'Distancia', unidad: 'm' }))
    this.registrarMetrica('velocidad', new MetricasTiempoReal({ nombre: 'Velocidad', unidad: 'm/s' }))

    this.registrarGrafica('trabajo_vs_distancia', new GraficaTemporal({
      titulo: 'Trabajo vs Distancia',
      ejeX: 'Distancia (m)',
      ejeY: 'Trabajo (J)',
    }))
    this.registrarGrafica('fuerza_vs_distancia', new GraficaTemporal({
      titulo: 'Fuerza vs Distancia',
      ejeX: 'Distancia (m)',
      ejeY: 'Fuerza (N)',
    }))

    const columnasResumen = [
      'Tiempo (s)',
      'Trabajo aplicado (J)',
      'Trabajo fricción (J)',
      'Trabajo neto (J)',
      'Fuerza (N)',
      'Distancia (m)',
      'Velocidad (m/s)',
    ]

    if (this._ultimoTipoResumen !== 'trabajo-constante') {
      this.resultado.tabla.establecerColumnas(columnasResumen)
    }

    const contextoConstante = {
      tipo: 'constante',
      caja,
      parametros: { ...config, coeficienteMu },
      acumulados: {
        trabajoAplicado: 0,
        trabajoFriccion: 0,
      },
      bloqueadoPorFriccion: false,
      huboMovimiento: false,
      ultimaFuerzaAplicada: 0,
      ultimaFuerzaFriccion: 0,
      resumenRegistrado: false,
      columnasResumen,
    }
    contextoConstante.obtenerFilaResumen = ({ tiempo, trabajoAplicado: ta, trabajoFriccion: tf, trabajoNeto: tn, fuerzaFinal, cajaFinal }) => ([
      Number(tiempo) || 0,
      Number(ta) || 0,
      Number(tf) || 0,
      Number(tn) || 0,
      Number(fuerzaFinal) || 0,
      Number(cajaFinal?.posicion ?? 0) || 0,
      Number(cajaFinal?.velocidad ?? 0) || 0,
    ])
    this._contextoTrabajoConstante = contextoConstante
    this._contextoTrabajoVariable = null
    this._contextoTrabajo = contextoConstante
    this._contextoPotencia = null
    this._contextoEnergia = null

    this.establecerFuerzaConstante({ fuerzaN })
    this.establecerFriccionActiva(false)
    if (caja) caja.coeficienteFriccion = 0
    this._ultimoTipoResumen = 'trabajo-constante'
    return this
  }

 // Configura el modo “trabajo variable”
  configurarTrabajoVariable({ parametrosTrabajo } = {}) {
    const dto = parametrosTrabajo || this.parametros?.obtenerTrabajoVariable?.()
    const config = dto?.toJSON ? dto.toJSON() : dto || {}

    const masaKg = Number(config.masaKg) || 0
    const distanciaMeta = Number(config.distanciaMetaM) || 0
    const k = Number(config.k) || 0
    const coeficienteMu = Number(config.coeficienteMu) || 0
    const offsetConfigurado = Number(config.offsetN)
    const offsetN = Number.isFinite(offsetConfigurado) ? offsetConfigurado : 0.1

    this.parametros?.conModo?.('trabajo-variable')
    this.tipo = 'trabajo-variable'
    this.estado = ESTADO_SIMULACION.Configurando
    this.limpiarObjetos()
    this.resetVisualizaciones()

    this.establecerSuperficieCesped({})
    const caja = this.agregarCaja({
      identificador: 'caja-trabajo-variable',
      masaKg,
      distanciaMeta,
    })
    if (caja) caja.coeficienteFriccion = 0

    this.registrarMetrica('tiempo', new MetricasTiempoReal({ nombre: 'Tiempo', unidad: 's' }))
    this.registrarMetrica('trabajo_aplicado', new MetricasTiempoReal({ nombre: 'Trabajo aplicado', unidad: 'J' }))
    this.registrarMetrica('trabajo_friccion', new MetricasTiempoReal({ nombre: 'Trabajo fricción', unidad: 'J' }))
    this.registrarMetrica('trabajo_neto', new MetricasTiempoReal({ nombre: 'Trabajo neto', unidad: 'J' }))
    this.registrarMetrica('fuerza_actual', new MetricasTiempoReal({ nombre: 'Fuerza', unidad: 'N' }))
    this.registrarMetrica('distancia', new MetricasTiempoReal({ nombre: 'Distancia', unidad: 'm' }))
    this.registrarMetrica('velocidad', new MetricasTiempoReal({ nombre: 'Velocidad', unidad: 'm/s' }))

    this.registrarGrafica('trabajo_vs_distancia', new GraficaTemporal({
      titulo: 'Trabajo vs Distancia',
      ejeX: 'Distancia (m)',
      ejeY: 'Trabajo (J)',
    }))
    this.registrarGrafica('fuerza_vs_distancia', new GraficaTemporal({
      titulo: 'Fuerza vs Distancia',
      ejeX: 'Distancia (m)',
      ejeY: 'Fuerza (N)',
    }))

    const columnasResumen = [
      'Tiempo (s)',
      'Trabajo aplicado (J)',
      'Trabajo fricción (J)',
      'Trabajo neto (J)',
      'Fuerza final (N)',
      'Distancia (m)',
      'Velocidad (m/s)',
      'Constante k (N/m)',
      'Offset (N)',
    ]

    if (this._ultimoTipoResumen !== 'trabajo-variable') {
      this.resultado.tabla.establecerColumnas(columnasResumen)
    }

    const contextoVariable = {
      tipo: 'variable',
      caja,
      parametros: { ...config, coeficienteMu, offsetN },
      acumulados: {
        trabajoAplicado: 0,
        trabajoFriccion: 0,
      },
      bloqueadoPorFriccion: false,
      huboMovimiento: false,
      ultimaFuerzaAplicada: 0,
      ultimaFuerzaFriccion: 0,
      resumenRegistrado: false,
      columnasResumen,
    }
    contextoVariable.obtenerFilaResumen = ({ tiempo, trabajoAplicado: ta, trabajoFriccion: tf, trabajoNeto: tn, fuerzaFinal, cajaFinal }) => ([
      Number(tiempo) || 0,
      Number(ta) || 0,
      Number(tf) || 0,
      Number(tn) || 0,
      Number(fuerzaFinal) || 0,
      Number(cajaFinal?.posicion ?? 0) || 0,
      Number(cajaFinal?.velocidad ?? 0) || 0,
      Number(contextoVariable.parametros?.k) || 0,
      Number(contextoVariable.parametros?.offsetN) || 0,
    ])
    this._contextoTrabajoVariable = contextoVariable
    this._contextoTrabajoConstante = null
    this._contextoTrabajo = contextoVariable
    this._contextoPotencia = null
    this._contextoEnergia = null

    const fuerza = this.establecerFuerzaVariable({ k, offsetN })
    fuerza?.establecerOffset?.(offsetN)
    this.establecerFriccionActiva(false)
    if (caja) caja.coeficienteFriccion = 0
    this._ultimoTipoResumen = 'trabajo-variable'
    return this
  }

  // Configura el modo “potencia”
  configurarPotencia({ parametrosPotencia } = {}) {
    const dto = parametrosPotencia || this.parametros?.obtenerPotencia?.()
    const config = dto?.toJSON ? dto.toJSON() : dto || {}

    const masaKg = Number(config.masaKg) || 0
    const alturaM = Number(config.alturaM) || 0
    const tiempoRapidoS = Math.max(1e-6, Number(config.tiempoRapidoS) || 0)
    const tiempoLentoS = Math.max(1e-6, Number(config.tiempoLentoS) || 0)

    this.tipo = 'potencia'
    this.estado = ESTADO_SIMULACION.Configurando
    this.limpiarObjetos()
    this.resetVisualizaciones()

    const cajaRapida = this.agregarCaja({ identificador: 'ascensor-rapido', masaKg, distanciaMeta: alturaM })
    const cajaLenta = this.agregarCaja({ identificador: 'ascensor-lento', masaKg, distanciaMeta: alturaM })

    this.establecerEdificio({})

    this.registrarMetrica('tiempo', new MetricasTiempoReal({ nombre: 'Tiempo', unidad: 's' }))
    this.registrarMetrica('potencia_rapida', new MetricasTiempoReal({ nombre: 'Potencia rápida', unidad: 'W' }))
    this.registrarMetrica('potencia_lenta', new MetricasTiempoReal({ nombre: 'Potencia lenta', unidad: 'W' }))
    this.registrarMetrica('altura_rapida', new MetricasTiempoReal({ nombre: 'Altura rápida', unidad: 'm' }))
    this.registrarMetrica('altura_lenta', new MetricasTiempoReal({ nombre: 'Altura lenta', unidad: 'm' }))
    this.registrarMetrica('trabajo_total', new MetricasTiempoReal({ nombre: 'Trabajo total', unidad: 'J' }))

    this.registrarGrafica('potencia_vs_tiempo_rapida', new GraficaTemporal({
      titulo: 'Potencia rápida',
      ejeX: 'Tiempo (s)',
      ejeY: 'Potencia (W)',
    }))
    this.registrarGrafica('potencia_vs_tiempo_lenta', new GraficaTemporal({
      titulo: 'Potencia lenta',
      ejeX: 'Tiempo (s)',
      ejeY: 'Potencia (W)',
    }))

    const columnasResumen = [
      'Tiempo total (s)',
      'Trabajo total (J)',
      'Potencia rápida (W)',
      'Potencia lenta (W)',
      'Altura rápida (m)',
      'Altura lenta (m)',
    ]
    if (this._ultimoTipoResumen !== 'potencia') {
      this.resultado.tabla.establecerColumnas(columnasResumen)
    }

    this._contextoPotencia = {
      masaKg,
      alturaM,
      rapido: { caja: cajaRapida, tiempoObjetivo: tiempoRapidoS, tiempoAcumulado: 0 },
      lento: { caja: cajaLenta, tiempoObjetivo: tiempoLentoS, tiempoAcumulado: 0 },
      resumenRegistrado: false,
      columnasResumen,
      alturaMeta: alturaM,
    }
    this._contextoTrabajo = null
    this._contextoEnergia = null
    this._ultimoTipoResumen = 'potencia'
    return this
  }

  // Configura el modo “energía cinética”
  configurarEnergiaCinetica({ parametrosEnergia } = {}) {
    const dto = parametrosEnergia || this.parametros?.obtenerEnergiaCinetica?.()
    const config = dto?.toJSON ? dto.toJSON() : dto || {}

    const masaKg = Number(config.masaKg) || 0
    const distanciaMetaM = Math.max(0, Number(config.distanciaMetaM) || 0)
    const velocidadFinalMs = Math.max(0, Number(config.velocidadFinalMs) || 0)

    this.tipo = 'energia-cinetica'
    this.estado = ESTADO_SIMULACION.Configurando
    this.limpiarObjetos()
    this.resetVisualizaciones()

    const vehiculo = this.agregarVehiculo({
      identificador: 'vehiculo-energia',
      masaKg,
      distanciaMeta: distanciaMetaM,
    })
    this.establecerSuperficiePista({})

    const aceleracion = distanciaMetaM > 0
      ? (velocidadFinalMs ** 2) / (2 * distanciaMetaM)
      : 0
    const fuerzaPropulsora = masaKg * aceleracion

    this.registrarMetrica('tiempo', new MetricasTiempoReal({ nombre: 'Tiempo', unidad: 's' }))
    this.registrarMetrica('energia_cinetica', new MetricasTiempoReal({ nombre: 'Energía cinética', unidad: 'J' }))
    this.registrarMetrica('velocidad', new MetricasTiempoReal({ nombre: 'Velocidad', unidad: 'm/s' }))
    this.registrarMetrica('distancia', new MetricasTiempoReal({ nombre: 'Distancia', unidad: 'm' }))
    this.registrarGrafica('energia_vs_tiempo', new GraficaTemporal({
      titulo: 'Energía cinética',
      ejeX: 'Tiempo (s)',
      ejeY: 'Energía (J)',
    }))
    this.registrarGrafica('velocidad_vs_tiempo', new GraficaTemporal({
      titulo: 'Velocidad',
      ejeX: 'Tiempo (s)',
      ejeY: 'Velocidad (m/s)',
    }))

    const columnasResumen = [
      'Tiempo total (s)',
      'Distancia final (m)',
      'Velocidad final (m/s)',
      'Energía cinética (J)',
    ]
    if (this._ultimoTipoResumen !== 'energia-cinetica') {
      this.resultado.tabla.establecerColumnas(columnasResumen)
    }

    this._contextoEnergia = {
      vehiculo,
      masaKg,
      distanciaMetaM,
      velocidadFinalMs,
      fuerzaPropulsora,
      resumenRegistrao: false,
      columnasResumen,
    }
    this._contextoTrabajo = null
    this._contextoPotencia = null
    this._ultimoTipoResumen = 'energia-cinetica'
    return this
  }

  // Configuración el modo "fuerzas conservativas"
  configurarFuerzasConservativas({ parametrosFuerzas } = {}) {
    const dto = parametrosFuerzas || this.parametros?.obtenerFuerzasConservativas?.()
    const config = dto?.toJSON ? dto.toJSON() : dto || {}

    const masaKg = Math.max(0, Number(config.masaKg) || 0)
    const alturaInicialM = Math.max(0, Number(config.alturaInicialM) || 0)
    const velocidadInicialMs = Number(config.velocidadInicialMs) || 0
    this.parametros?.conModo?.('fuerzas-conservativas')
    this.tipo = 'fuerzas-conservativas'
    this.estado = ESTADO_SIMULACION.Configurando
    this.limpiarObjetos()
    this.resetVisualizaciones()

    const suelo = this.establecerSuperficieSuelo({
      alturaReferencia: 0,
      rutaImagen: config.rutaSuelo || '/assets/sueloConservativo.png',
    })

    const bola = this.agregarBola({
      identificador: 'bola-caida-libre',
      masaKg,
      altura: Math.max(alturaInicialM, suelo.obtenerAltura()),
      velocidad: velocidadInicialMs,
      rutaImagen: config.rutaBola || '/assets/bolaConservativa.png',
      trabajoAcumulado: 0,
      completada: false,
    })

    this.registrarMetrica('tiempo', new MetricasTiempoReal({ nombre: 'Tiempo', unidad: 's' }))
    this.registrarMetrica('altura', new MetricasTiempoReal({ nombre: 'Altura', unidad: 'm' }))
    this.registrarMetrica('velocidad', new MetricasTiempoReal({ nombre: 'Velocidad', unidad: 'm/s' }))
    this.registrarMetrica('aceleracion', new MetricasTiempoReal({ nombre: 'Aceleración', unidad: 'm/s²' }))
    this.registrarMetrica('trabajo_gravedad', new MetricasTiempoReal({ nombre: 'Trabajo gravedad', unidad: 'J' }))
    this.registrarMetrica('energia_potencial', new MetricasTiempoReal({ nombre: 'E. potencial', unidad: 'J' }))
    this.registrarMetrica('energia_cinetica', new MetricasTiempoReal({ nombre: 'E. cinética', unidad: 'J' }))
    this.registrarMetrica('energia_mecanica', new MetricasTiempoReal({ nombre: 'E. mecánica', unidad: 'J' }))

    this.registrarGrafica('altura_vs_tiempo', new GraficaTemporal({
      titulo: 'Altura vs Tiempo',
      ejeX: 'Tiempo (s)',
      ejeY: 'Altura (m)',
    }))
    this.registrarGrafica('velocidad_vs_tiempo', new GraficaTemporal({
      titulo: 'Velocidad vs Tiempo',
      ejeX: 'Tiempo (s)',
      ejeY: 'Velocidad (m/s)',
    }))
    this.registrarGrafica('energia_mecanica_vs_tiempo', new GraficaTemporal({
      titulo: 'Energía mecánica vs Tiempo',
      ejeX: 'Tiempo (s)',
      ejeY: 'Energía (J)',
    }))

    const columnasResumen = [
      'Tiempo total (s)',
      'Altura inicial (m)',
      'Altura final (m)',
      'Velocidad final (m/s)',
      'Trabajo gravedad (J)',
      'E. mecánica inicial (J)',
      'E. mecánica final (J)',
    ]
    if (this._ultimoTipoResumen !== 'fuerzas-conservativas') {
      this.resultado.tabla.establecerColumnas(columnasResumen)
    }

    const alturaInicialReferencia = Math.max(suelo.obtenerAltura(), Math.min(alturaInicialM, 20))
    const energiaMecanicaInicial = masaKg * G * Math.max(0, alturaInicialReferencia - suelo.obtenerAltura()) + 0.5 * masaKg * (velocidadInicialMs ** 2)

    this._contextoConservativo = {
      bola,
      suelo,
      masaKg,
      alturaInicial: alturaInicialReferencia,
      pasoIntegracion: 0.016,
      columnasResumen,
      trabajoTotal: 0,
      velocidadInicial: velocidadInicialMs,
      energiaMecanicaInicial,
      energiaMecanicaActual: energiaMecanicaInicial,
      resumenRegistrado: false,
      gravedad: G,
    }

    this._contextoTrabajo = null
    this._contextoTrabajoConstante = null
    this._contextoTrabajoVariable = null
    this._contextoPotencia = null
    this._contextoEnergia = null
    this._ultimoTipoResumen = 'fuerzas-conservativas'
    this._friccionActiva = false
    return this
  }

// ---------------------------------------------------------------------------
// Ciclo de vida   SimulacionGeneral` invoca este chequeo antes de iniciar, usando el DTO correspondiente al modo seleccionado
// ---------------------------------------------------------------------------

  validarParametros() {
    return this.parametros?.conModo?.(this.tipo)?.validar?.() !== false
  }

  // La plantilla llama a `iniciar()` al presionar "Iniciar simulación".
  iniciar() {
    if (!this.validarParametros()) throw new Error('Parámetros inválidos para iniciar la simulación')
    this.cronometro.reiniciar()
    this.cronometro.iniciar()
    this.estado = ESTADO_SIMULACION.Corriendo
    if (this._friccionActiva) {
      this._estadoAntesFriccion = ESTADO_SIMULACION.Corriendo
      this.pausar()
    }
  }

  // Correspondiente al botón "Pausar" en la UI.
  pausar() {
    if (this.estado !== ESTADO_SIMULACION.Corriendo) return
    this.cronometro.detener()
    this.estado = ESTADO_SIMULACION.Pausada
  }

  // Reanudación solicitada desde la plantilla cuando el usuario pulsa "Reanudar".
  reanudar() {
    if (this.estado !== ESTADO_SIMULACION.Pausada) return
    this.cronometro.iniciar()
    this.estado = ESTADO_SIMULACION.Corriendo
  }

  // Este método lo llama la plantilla cuando el usuario presiona "Reiniciar".
  reiniciar() {
    this.cronometro.reiniciar()
    this.cajas.forEach(caja => caja.reiniciar())
    this.vehiculos.forEach(vehiculo => vehiculo.reiniciar())
    this.metricas.forEach(metrica => metrica.limpiar?.())
    this.graficas.forEach(grafica => grafica.limpiar?.())
    const resetTrabajo = (ctx) => {
      if (!ctx) return
      if (ctx.acumulados) {
        ctx.acumulados.trabajoAplicado = 0
        ctx.acumulados.trabajoFriccion = 0
      }
      ctx.bloqueadoPorFriccion = false
      ctx.huboMovimiento = false
      ctx.ultimaFuerzaAplicada = 0
      ctx.ultimaFuerzaFriccion = 0
      ctx.resumenRegistrado = false
    }
    resetTrabajo(this._contextoTrabajoConstante)
    resetTrabajo(this._contextoTrabajoVariable)
    resetTrabajo(this._contextoTrabajo)
    if (this._contextoPotencia) {
      this._contextoPotencia.rapido.tiempoAcumulado = 0
      this._contextoPotencia.lento.tiempoAcumulado = 0
      this._contextoPotencia.resumenRegistrado = false
    }
    if (this._contextoEnergia) {
      this._contextoEnergia.vehiculo?.reiniciar?.()
      this._contextoEnergia.resumenRegistrado = false
    }
    if (this._contextoConservativo) {
      const { bola, alturaInicial, velocidadInicial = 0, energiaMecanicaInicial = 0 } = this._contextoConservativo
      this._contextoConservativo.trabajoTotal = 0
      this._contextoConservativo.energiaMecanicaActual = energiaMecanicaInicial
      this._contextoConservativo.resumenRegistrado = false
      if (bola?.reiniciar) {
        bola.reiniciar({
          altura: alturaInicial,
          velocidad: velocidadInicial,
          trabajoAcumulado: 0,
          completada: false,
        })
      }
    }
    this._friccionActiva = false
    this._estadoAntesFriccion = null
    this.estado = ESTADO_SIMULACION.Configurando
  }

  // Marca la simulación como terminada; la plantilla lo detecta y muestra el modal de resultados.
  finalizar() {
    this.cronometro.detener()
    this.estado = ESTADO_SIMULACION.Finalizada
    this._estadoAntesFriccion = null
  }

  // La UI llama a este método cuando el usuario activa/desactiva la fricción.
  establecerFriccionActiva(activa) {
    const siguiente = Boolean(activa)
    this._friccionActiva = siguiente

    if (this._contextoConservativo?.bola) {
      this._friccionActiva = false
      return
    }

    if (!siguiente && this._contextoTrabajo?.bloqueadoPorFriccion) {
      this._contextoTrabajo.bloqueadoPorFriccion = false
      if (this.estado === ESTADO_SIMULACION.Pausada) {
        this.reanudar()
      }
    }
  }


// ---------------------------------------------------------------------------
// Registrar   Compila la fila del resumen final para del modo. La plantilla muestra estas filas en la tabla de resultados.
// ---------------------------------------------------------------------------

  // Prepara la fila de resumen y el texto explicativo del modo trabajo constante o variable.
  _registrarResumenTrabajo(ctx, {
    tiempo,
    trabajoAplicado,
    trabajoFriccion,
    trabajoNeto,
    fuerzaFinal,
  }) {
    if (!ctx || typeof ctx.obtenerFilaResumen !== 'function') return
    const fila = ctx.obtenerFilaResumen({
      tiempo,
      trabajoAplicado,
      trabajoFriccion,
      trabajoNeto,
      fuerzaFinal,
      cajaFinal: ctx.caja,
    })
    this.resultado.agregarFilaResumen({
      columnas: Array.isArray(ctx.columnasResumen) ? ctx.columnasResumen : [],
      fila,
    })
    ctx.resumenRegistrado = true
    const distanciaFinal = Number(ctx.caja?.posicion ?? ctx.caja?.distanciaMeta ?? 0) || 0
    this._actualizarInterpretacionSegura(this._crearInterpretacionTrabajo({
      tiempo,
      trabajoAplicado,
      trabajoFriccion,
      trabajoNeto,
      fuerzaFinal,
      distancia: distanciaFinal,
      modo: ctx.tipo || 'constante',
    }))
  }

  // Prepara la fila de resumen y el texto explicativo del modo potencia.
  _registrarResumenPotencia(ctx, tiempoActual, rapidoInfo, lentoInfo) {
    if (!ctx) return
    const columnas = Array.isArray(ctx.columnasResumen) && ctx.columnasResumen.length > 0 ? ctx.columnasResumen : [
      'Tiempo total (s)',
      'Trabajo total (J)',
      'Potencia rápida (W)',
      'Potencia lenta (W)',
      'Altura rápida (m)',
      'Altura lenta (m)',
    ]
    const trabajoTotal = Number(rapidoInfo?.trabajo ?? lentoInfo?.trabajo ?? (ctx.masaKg * G * ctx.alturaM)) || 0
    const fila = [
      Number(tiempoActual) || 0,
      trabajoTotal,
      Number(rapidoInfo?.potencia) || 0,
      Number(lentoInfo?.potencia) || 0,
      Number(ctx.rapido?.caja?.posicion ?? 0) || 0,
      Number(ctx.lento?.caja?.posicion ?? 0) || 0,
    ]
    this.resultado.agregarFilaResumen({ columnas, fila })
    ctx.resumenRegistrado = true
    this._actualizarInterpretacionSegura(this._crearInterpretacionPotencia({
      tiempo: tiempoActual,
      trabajoTotal,
      potenciaRapida: Number(rapidoInfo?.potencia) || 0,
      potenciaLenta: Number(lentoInfo?.potencia) || 0,
      alturaMeta: ctx.alturaM,
      tiempoRapido: ctx.rapido?.tiempoAcumulado ?? 0,
      tiempoLento: ctx.lento?.tiempoAcumulado ?? 0,
    }))
  }

  // prepara la fila de resumen y el texto explicativo del modo energía cinética.
  _registrarResumenEnergia(ctx, tiempoActual) {
    if (!ctx || !ctx.vehiculo) return
    const columnas = Array.isArray(ctx.columnasResumen) && ctx.columnasResumen.length > 0 ? ctx.columnasResumen : [
      'Tiempo total (s)',
      'Distancia final (m)',
      'Velocidad final (m/s)',
      'Energía cinética (J)',
    ]
    const vehiculo = ctx.vehiculo
    const fila = [
      Number(tiempoActual) || 0,
      Number(vehiculo.distanciaRecorrida ?? vehiculo.posicion ?? 0) || 0,
      Number(vehiculo.velocidad ?? 0) || 0,
      Number(vehiculo.energiaCinetica ?? 0) || 0,
    ]
    this.resultado.agregarFilaResumen({ columnas, fila })
    ctx.resumenRegistrado = true
    this._actualizarInterpretacionSegura(this._crearInterpretacionEnergia({
      tiempo: tiempoActual,
      distancia: Number(ctx.vehiculo.distanciaRecorrida ?? ctx.distanciaMetaM ?? 0) || 0,
      distanciaMeta: ctx.distanciaMetaM,
      velocidad: Number(ctx.vehiculo.velocidad ?? 0) || 0,
      energia: Number(ctx.vehiculo.energiaCinetica ?? 0) || 0,
    }))
  }

// Prepara la fila de resumen y el texto explicativo del modo fuerzas conservativas.
  _registrarResumenFuerzasConservativas(ctx, tiempoActual) {
    if (!ctx || !ctx.bola) return
    const columnas = Array.isArray(ctx.columnasResumen) && ctx.columnasResumen.length > 0 ? ctx.columnasResumen : [
      'Tiempo total (s)',
      'Altura inicial (m)',
      'Altura final (m)',
      'Velocidad final (m/s)',
      'Trabajo gravedad (J)',
      'E. mecánica inicial (J)',
      'E. mecánica final (J)',
    ]

    const bola = ctx.bola
    const fila = [
      Number(tiempoActual) || 0,
      Number(ctx.alturaInicial) || 0,
      Number(ctx.alturaFinal ?? bola.altura) || 0,
      Number(ctx.velocidadFinal ?? bola.velocidad) || 0,
      Number(ctx.trabajoTotal) || 0,
      Number(ctx.energiaMecanicaInicial) || 0,
      Number(ctx.energiaMecanicaActual ?? ctx.energiaMecanicaInicial) || 0,
    ]

    this.resultado.agregarFilaResumen({ columnas, fila })
    ctx.resumenRegistrado = true

    this._actualizarInterpretacionSegura(this._crearInterpretacionFuerzasConservativas({
      tiempo: tiempoActual,
      alturaInicial: ctx.alturaInicial,
      alturaFinal: ctx.alturaFinal ?? bola.altura,
      velocidadFinal: ctx.velocidadFinal ?? bola.velocidad,
      trabajoGravedad: ctx.trabajoTotal,
      energiaInicial: ctx.energiaMecanicaInicial,
      energiaFinal: ctx.energiaMecanicaActual ?? ctx.energiaMecanicaInicial,
    }))
  }

// ---------------------------------------------------------------------------
// Interpretacion    Textos descriptivos que se muestran en el modal final, variante para explicar los resultados al estudiante.
// ---------------------------------------------------------------------------

  // Texto resumen del modo conservativo.
  _crearInterpretacionFuerzasConservativas({
    tiempo,
    alturaInicial,
    alturaFinal,
    velocidadFinal,
    trabajoGravedad,
    energiaInicial,
    energiaFinal,
  }) {
    const tiempoTxt = this._formatearNumero(tiempo)
    const alturaInicialTxt = this._formatearNumero(alturaInicial)
    const alturaFinalTxt = this._formatearNumero(alturaFinal)
    const velocidadFinalTxt = this._formatearNumero(velocidadFinal)
    const trabajoTxt = this._formatearNumero(trabajoGravedad)
    const energiaInicialTxt = this._formatearNumero(energiaInicial)
    const energiaFinalTxt = this._formatearNumero(energiaFinal)

    const alturaMensaje = alturaFinal > 0
      ? `La esfera aún se encuentra a ${alturaFinalTxt} m del suelo, conservando parte de su energía potencial.`
      : 'La esfera alcanzó el suelo y, en este modelo ideal, la energía potencial se transformó completamente en energía cinética justo antes del impacto.'

    const conservacionMensaje = Math.abs(energiaInicial - energiaFinal) < 1e-2
      ? `La energía mecánica final (${energiaFinalTxt} J) coincide con la inicial, lo que evidencia la conservación de la energía mecánica cuando solo actúa la gravedad.`
      : `La energía mecánica inicial (${energiaInicialTxt} J) y la final (${energiaFinalTxt} J) presentan una ligera diferencia debido a efectos numéricos; en un sistema conservativo ideal deberían coincidir.`

    return `La fuerza de gravedad actúa como una fuerza conservativa: en ${tiempoTxt} s la esfera descendió desde ${alturaInicialTxt} m. La gravedad realizó ${trabajoTxt} J de trabajo y la energía mecánica se mantuvo constante (energía cinética final ${velocidadFinalTxt} m/s). ${alturaMensaje} ${conservacionMensaje}`
  }
// Texto resumen del modo trabajo.
  _crearInterpretacionTrabajo({
    tiempo,
    trabajoAplicado,
    trabajoFriccion,
    trabajoNeto,
    fuerzaFinal,
    distancia,
    modo,
  }) {
    const tiempoTxt = this._formatearNumero(tiempo)
    const distanciaTxt = this._formatearNumero(distancia)
    const trabajoAplicadoTxt = this._formatearNumero(trabajoAplicado)
    const trabajoNetoTxt = this._formatearNumero(trabajoNeto)
    const fuerzaTxt = this._formatearNumero(fuerzaFinal)

    const friccionTxt = Math.abs(trabajoFriccion) > 1e-3
      ? `La fricción disipó ${this._formatearNumero(Math.abs(trabajoFriccion))} J, por eso el trabajo neto terminó en ${trabajoNetoTxt} J.`
      : 'No hubo pérdidas por fricción, así que el trabajo aplicado y el neto coinciden.'

    const modoTxt = modo === 'variable'
      ? 'La fuerza fue aumentando con la distancia, de modo que la pendiente de la curva Trabajo aplicado vs. Distancia cambia a medida que la caja avanza.'
      : 'Como la fuerza aplicada se mantuvo casi constante, la curva Trabajo aplicado vs. Distancia crece con una pendiente casi uniforme.'

    const graficaTxt = Math.abs(trabajoFriccion) > 1e-3
      ? 'En la gráfica verás que la curva del trabajo neto crece más lentamente que la del trabajo aplicado; la separación entre ambas refleja la energía que se perdió por fricción.'
      : 'En la gráfica Trabajo vs. Distancia ambas curvas se superponen, indicando que toda la energía aplicada se transformó en trabajo útil.'

    return `En ${tiempoTxt} s la caja recorrió ${distanciaTxt} m aplicando ${trabajoAplicadoTxt} J con una fuerza final de ${fuerzaTxt} N. ${friccionTxt} ${modoTxt} ${graficaTxt}`
  }

  // Texto resumen del modo potencia.
  _crearInterpretacionPotencia({
    tiempo,
    trabajoTotal,
    potenciaRapida,
    potenciaLenta,
    alturaMeta,
    tiempoRapido,
    tiempoLento,
  }) {
    const tiempoTxt = this._formatearNumero(tiempo)
    const alturaTxt = this._formatearNumero(alturaMeta)
    const trabajoTxt = this._formatearNumero(trabajoTotal)
    const potenciaRapidaTxt = this._formatearNumero(potenciaRapida)
    const potenciaLentaTxt = this._formatearNumero(potenciaLenta)
    const tiempoRapidoTxt = this._formatearNumero(tiempoRapido)
    const tiempoLentoTxt = this._formatearNumero(tiempoLento)
    const diferenciaPotencia = potenciaRapida - potenciaLenta
    const quienGana = diferenciaPotencia >= 0 ? 'rápido' : 'lento'

    let comparacionPotencia
    if (Math.abs(diferenciaPotencia) < 1e-3) {
      comparacionPotencia = 'Ambos elevadores entregaron prácticamente la misma potencia promedio.'
    } else if (Math.abs(potenciaLenta) > 1e-6) {
      comparacionPotencia = `El ascensor ${quienGana} fue ${this._formatearNumero(Math.abs(potenciaRapida / potenciaLenta), 2)} veces más potente porque completó el mismo trabajo en un tiempo distinto.`
    } else {
      comparacionPotencia = `El ascensor ${quienGana} entregó la mayor parte de la potencia útil; el otro apenas aportó energía durante el ensayo.`
    }

    const graficaTxt = 'En la gráfica Potencia vs. Tiempo puedes comparar directamente ambas curvas: la del ascensor rápido permanece por encima cuando tarda menos en alcanzar la altura objetivo.'

    return `Para elevar la masa ${alturaTxt} m se realizó un trabajo de ${trabajoTxt} J. El ascensor rápido tardó ${tiempoRapidoTxt} s y entregó ${potenciaRapidaTxt} W, mientras que el lento tardó ${tiempoLentoTxt} s con ${potenciaLentaTxt} W. ${comparacionPotencia} ${graficaTxt}`
  }

  // Texto resumen del modo energía cinética.
  _crearInterpretacionEnergia({
    tiempo,
    distancia,
    distanciaMeta,
    velocidad,
    energia,
  }) {
    const tiempoTxt = this._formatearNumero(tiempo)
    const distanciaTxt = this._formatearNumero(distancia)
    const distanciaMetaTxt = this._formatearNumero(distanciaMeta ?? distancia)
    const velocidadTxt = this._formatearNumero(velocidad)
    const energiaTxt = this._formatearNumero(energia)

    const distanciaComentario = distanciaMeta && distanciaMeta > 0
      ? `Se alcanzó la meta propuesta de ${distanciaMetaTxt} m de recorrido.`
      : `El vehículo avanzó ${distanciaTxt} m durante la simulación.`

    const graficaTxt = 'La gráfica Energía vs. Tiempo muestra cómo la energía cinética crece conforme aumenta la velocidad; la gráfica Velocidad vs. Tiempo te permite comprobar si el incremento fue constante o si hubo variaciones.'

    return `En ${tiempoTxt} s el vehículo avanzó ${distanciaTxt} m y terminó con una velocidad de ${velocidadTxt} m/s, lo que corresponde a una energía cinética de ${energiaTxt} J. ${distanciaComentario} ${graficaTxt}`
  }

// ---------------------------------------------------------------------------
// Avance  delega en Movimientoy sincroniza métricas/graficas que consume la UI.
// ---------------------------------------------------------------------------

  // `PlantillaSimulacion.jsx` ejecuta este método en cada frame (`requestAnimationFrame`) para avanzar la simulación y refrescar métricas / gráficas.
  actualizar(deltaT) {
    if (this.estado !== ESTADO_SIMULACION.Corriendo) return
    const dt = Math.max(0, Number(deltaT) || 0)
    if (dt <= 0) return

    const tiempoActual = this.cronometro.avanzar(dt)

    if (this.tipo === 'trabajo-constante') {
      this._actualizarTrabajoConstante(dt, tiempoActual)
    } else if (this.tipo === 'trabajo-variable') {
      this._actualizarTrabajoVariable(dt, tiempoActual)
    } else if (this.tipo === 'potencia') {
      this._actualizarPotencia(dt, tiempoActual)
    } else if (this.tipo === 'energia-cinetica') {
      this._actualizarEnergia(dt, tiempoActual)
    } else if (this.tipo === 'fuerzas-conservativas') {
      this._actualizarFuerzasConservativas(dt, tiempoActual)
    }
  }

// Avance del modo trabajo con fuerza constante.
  _actualizarTrabajoConstante(dt, tiempoActual) {
    const ctx = this._contextoTrabajoConstante
    if (!ctx || !ctx.caja) return
    this._contextoTrabajo = ctx

    const { caja, parametros, acumulados } = ctx
    const masa = Math.max(1e-6, Number(caja?.masaKg ?? parametros?.masaKg ?? 0) || 0)
    const distanciaMeta = Math.max(0, Number(parametros?.distanciaMetaM ?? caja?.distanciaMeta ?? 0) || 0)
    const pasoIntegracion = Math.max(1e-4, Math.min(0.02, Number(parametros?.pasoDtS) || 0.01))

    let restante = Math.max(0, Number(dt) || 0)
    if (!(restante > 0)) return

    const fuerzaConstanteBase = this.fuerzaConstante?.valor?.() ?? Number(parametros?.fuerzaN ?? 0)

    const muActivo = this._friccionActiva
      ? Math.max(0, Number(caja?.coeficienteFriccion ?? parametros?.coeficienteMu ?? 0) || 0)
      : 0
    const fuerzaNormal = masa * G
    const limiteFriccion = muActivo * fuerzaNormal

    const toleranciaVelocidad = 1e-6
    const toleranciaPaso = 1e-8

    let huboMovimiento = false
    let ultimaFuerzaAplicada = this.fuerzaConstante?.valor?.() ?? fuerzaConstanteBase
    let ultimaFuerzaFriccion = 0
    let ultimoBloqueoPorFriccion = false

    while (restante > toleranciaPaso && !caja.completada) {
      const paso = Math.min(pasoIntegracion, restante)
      const posicion = Number(caja.posicion ?? 0) || 0
      const velocidad = Number(caja.velocidad ?? 0) || 0

      const fuerzaAplicada = this.fuerzaConstante?.valor?.() ?? fuerzaConstanteBase
      let fuerzaFriccion = 0
      let fuerzaNeta = fuerzaAplicada
      let bloqueadaEstePaso = false

      if (limiteFriccion > 0) {
        if (Math.abs(velocidad) > toleranciaVelocidad) {
          fuerzaFriccion = -limiteFriccion * Math.sign(velocidad)
          fuerzaNeta += fuerzaFriccion
        } else if (Math.abs(fuerzaAplicada) <= limiteFriccion + 1e-9) {
          fuerzaFriccion = -fuerzaAplicada
          fuerzaNeta = 0
          bloqueadaEstePaso = true
        } else {
          fuerzaFriccion = -limiteFriccion * Math.sign(fuerzaAplicada || 1)
          fuerzaNeta += fuerzaFriccion
        }
      }

      let desplazamiento = 0
      let nuevaVelocidad = velocidad
      let nuevaPosicion = posicion
      let tiempoConsumido = paso

      if (!bloqueadaEstePaso) {
        if (Math.abs(fuerzaNeta) > 0) {
          const aceleracion = fuerzaNeta / masa
          const velocidadTentativa = velocidad + aceleracion * paso

          if (Math.abs(velocidad) > toleranciaVelocidad && Math.sign(velocidadTentativa) !== Math.sign(velocidad)) {
            const tiempoHastaDetenerse = Math.max(0, Math.min(paso, Math.abs(velocidad / aceleracion)))
            const desplazamientoHastaDetenerse = velocidad * tiempoHastaDetenerse + 0.5 * aceleracion * tiempoHastaDetenerse * tiempoHastaDetenerse

            desplazamiento = desplazamientoHastaDetenerse
            nuevaPosicion = posicion + desplazamientoHastaDetenerse
            nuevaVelocidad = 0
            tiempoConsumido = Math.max(toleranciaPaso, tiempoHastaDetenerse)
          } else {
            desplazamiento = velocidad * paso + 0.5 * aceleracion * paso * paso
            nuevaPosicion = posicion + desplazamiento
            nuevaVelocidad = velocidadTentativa
          }
        } else if (Math.abs(velocidad) > toleranciaVelocidad) {
          desplazamiento = velocidad * paso
          nuevaPosicion = posicion + desplazamiento
          nuevaVelocidad = velocidad
        }
      }

      const movimientoEnPaso = Math.abs(desplazamiento) > toleranciaPaso
      if (movimientoEnPaso) {
        if (distanciaMeta > 0 && nuevaPosicion >= distanciaMeta) {
          desplazamiento = distanciaMeta - posicion
          nuevaPosicion = distanciaMeta
          caja.completada = true
        } else if (nuevaPosicion < 0) {
          desplazamiento = -posicion
          nuevaPosicion = 0
          nuevaVelocidad = 0
        }

        huboMovimiento = true
        ultimoBloqueoPorFriccion = false

        if (acumulados) {
          acumulados.trabajoAplicado += fuerzaAplicada * desplazamiento
          acumulados.trabajoFriccion += fuerzaFriccion * desplazamiento
        }
      } else {
        ultimoBloqueoPorFriccion = bloqueadaEstePaso
      }

      caja.posicion = nuevaPosicion
      const velocidadResultante = Math.abs(nuevaVelocidad) < toleranciaVelocidad ? 0 : nuevaVelocidad
      caja.velocidad = velocidadResultante
      caja.energiaCinetica = 0.5 * masa * caja.velocidad * caja.velocidad

      ultimaFuerzaAplicada = fuerzaAplicada
      ultimaFuerzaFriccion = fuerzaFriccion
      restante -= tiempoConsumido

      if (ultimoBloqueoPorFriccion && !huboMovimiento) {
        break
      }
    }

    ctx.huboMovimiento = Boolean(ctx.huboMovimiento || huboMovimiento)
    ctx.bloqueadoPorFriccion = Boolean(ultimoBloqueoPorFriccion && this._friccionActiva)
    ctx.ultimaFuerzaAplicada = ultimaFuerzaAplicada
    ctx.ultimaFuerzaFriccion = ultimaFuerzaFriccion

    const trabajoAplicado = acumulados?.trabajoAplicado ?? 0
    const trabajoFriccion = acumulados?.trabajoFriccion ?? 0
    const trabajoNeto = trabajoAplicado + trabajoFriccion // W_neto = W_aplicado + W_fric

    this.actualizarMetrica('tiempo', tiempoActual, tiempoActual)
    this.actualizarMetrica('trabajo_aplicado', tiempoActual, trabajoAplicado) // W = F·Δx acumulado
    this.actualizarMetrica('trabajo_friccion', tiempoActual, trabajoFriccion) // W_fric = F_fric·Δx
    this.actualizarMetrica('trabajo_neto', tiempoActual, trabajoNeto)
    this.actualizarMetrica('fuerza_actual', tiempoActual, ultimaFuerzaAplicada)
    this.actualizarMetrica('distancia', tiempoActual, caja.posicion)
    this.actualizarMetrica('velocidad', tiempoActual, caja.velocidad) // v = v0 + a·dt

    if (huboMovimiento) {
      this.actualizarGrafica('trabajo_vs_distancia', caja.posicion, trabajoNeto)
      this.actualizarGrafica('fuerza_vs_distancia', caja.posicion, ultimaFuerzaAplicada)
    }

    if (distanciaMeta > 0 && caja.posicion >= distanciaMeta - 1e-6) {
      caja.posicion = distanciaMeta
      caja.completada = true
    }

    if (caja.completada) {
      if (!ctx.resumenRegistrado) {
        this._registrarResumenTrabajo(ctx, {
          tiempo: tiempoActual,
          trabajoAplicado,
          trabajoFriccion,
          trabajoNeto,
          fuerzaFinal: ultimaFuerzaAplicada,
        })
      }
      this.finalizar()
    } else if (ctx.bloqueadoPorFriccion) {
      this.pausar()
    } else {
      ctx.bloqueadoPorFriccion = false
    }
  }

  // avance la simulación en el modo de trabajo con fuerza variable.
  _actualizarTrabajoVariable(dt, tiempoActual) {
    const ctx = this._contextoTrabajoVariable
    if (!ctx || !ctx.caja) return
    this._contextoTrabajo = ctx

    const { caja, parametros, acumulados } = ctx
    const masa = Math.max(1e-6, Number(caja?.masaKg ?? parametros?.masaKg ?? 0) || 0)
    const distanciaMeta = Math.max(0, Number(parametros?.distanciaMetaM ?? caja?.distanciaMeta ?? 0) || 0)
    const pasoIntegracion = Math.max(1e-4, Math.min(0.02, Number(parametros?.pasoDtS) || 0.01))

    let restante = Math.max(0, Number(dt) || 0)
    if (!(restante > 0)) return

    const muActivo = this._friccionActiva
      ? Math.max(0, Number(caja?.coeficienteFriccion ?? parametros?.coeficienteMu ?? 0) || 0)
      : 0
    const fuerzaNormal = masa * G
    const limiteFriccion = muActivo * fuerzaNormal

    const offsetSeleccionado = Number(parametros?.offsetN)
    if (Number.isFinite(offsetSeleccionado)) {
      this.fuerzaVariable?.establecerOffset?.(offsetSeleccionado)
    }

    const toleranciaVelocidad = 1e-6
    const toleranciaPaso = 1e-8

    let huboMovimiento = false
    let ultimaFuerzaAplicada = this.fuerzaVariable?.valor?.(Number(caja.posicion ?? 0) || 0) ?? 0
    let ultimaFuerzaFriccion = 0
    let ultimoBloqueoPorFriccion = false

    while (restante > toleranciaPaso && !caja.completada) {
      const paso = Math.min(pasoIntegracion, restante)
      const posicion = Number(caja.posicion ?? 0) || 0
      const velocidad = Number(caja.velocidad ?? 0) || 0

      const fuerzaAplicada = this.fuerzaVariable?.valor?.(posicion) ?? (
        (Number(parametros?.offsetN) || 0) + (Number(parametros?.k) || 0) * Math.max(0, posicion)
      )
      let fuerzaFriccion = 0
      let fuerzaNeta = fuerzaAplicada
      let bloqueadaEstePaso = false

      if (limiteFriccion > 0) {
        if (Math.abs(velocidad) > toleranciaVelocidad) {
          fuerzaFriccion = -limiteFriccion * Math.sign(velocidad)
          fuerzaNeta += fuerzaFriccion
        } else if (Math.abs(fuerzaAplicada) <= limiteFriccion + 1e-9) {
          fuerzaFriccion = -fuerzaAplicada
          fuerzaNeta = 0
          bloqueadaEstePaso = true
        } else {
          fuerzaFriccion = -limiteFriccion * Math.sign(fuerzaAplicada || 1)
          fuerzaNeta += fuerzaFriccion
        }
      }

      let desplazamiento = 0
      let nuevaVelocidad = velocidad
      let nuevaPosicion = posicion
      let tiempoConsumido = paso

      if (!bloqueadaEstePaso) {
        if (Math.abs(fuerzaNeta) > 0) {
          const aceleracion = fuerzaNeta / masa
          const velocidadTentativa = velocidad + aceleracion * paso

          if (Math.abs(velocidad) > toleranciaVelocidad && Math.sign(velocidadTentativa) !== Math.sign(velocidad)) {
            const tiempoHastaDetenerse = Math.max(0, Math.min(paso, Math.abs(velocidad / aceleracion)))
            const desplazamientoHastaDetenerse = velocidad * tiempoHastaDetenerse + 0.5 * aceleracion * tiempoHastaDetenerse * tiempoHastaDetenerse

            desplazamiento = desplazamientoHastaDetenerse
            nuevaPosicion = posicion + desplazamientoHastaDetenerse
            nuevaVelocidad = 0
            tiempoConsumido = Math.max(toleranciaPaso, tiempoHastaDetenerse)
          } else {
            desplazamiento = velocidad * paso + 0.5 * aceleracion * paso * paso
            nuevaPosicion = posicion + desplazamiento
            nuevaVelocidad = velocidadTentativa
          }
        } else if (Math.abs(velocidad) > toleranciaVelocidad) {
          desplazamiento = velocidad * paso
          nuevaPosicion = posicion + desplazamiento
          nuevaVelocidad = velocidad
        }
      }

      const movimientoEnPaso = Math.abs(desplazamiento) > toleranciaPaso
      if (movimientoEnPaso) {
        if (distanciaMeta > 0 && nuevaPosicion >= distanciaMeta) {
          desplazamiento = distanciaMeta - posicion
          nuevaPosicion = distanciaMeta
          caja.completada = true
        } else if (nuevaPosicion < 0) {
          desplazamiento = -posicion
          nuevaPosicion = 0
          nuevaVelocidad = 0
        }

        huboMovimiento = true
        ultimoBloqueoPorFriccion = false

        if (acumulados) {
          acumulados.trabajoAplicado += fuerzaAplicada * desplazamiento
          acumulados.trabajoFriccion += fuerzaFriccion * desplazamiento
        }
      } else {
        ultimoBloqueoPorFriccion = bloqueadaEstePaso
      }

      caja.posicion = nuevaPosicion
      const velocidadResultante = Math.abs(nuevaVelocidad) < toleranciaVelocidad ? 0 : nuevaVelocidad
      caja.velocidad = velocidadResultante
      caja.energiaCinetica = 0.5 * masa * caja.velocidad * caja.velocidad

      ultimaFuerzaAplicada = fuerzaAplicada
      ultimaFuerzaFriccion = fuerzaFriccion
      restante -= tiempoConsumido

      if (ultimoBloqueoPorFriccion && !huboMovimiento) {
        break
      }
    }

    ctx.huboMovimiento = Boolean(ctx.huboMovimiento || huboMovimiento)
    ctx.bloqueadoPorFriccion = Boolean(ultimoBloqueoPorFriccion && this._friccionActiva)
    ctx.ultimaFuerzaAplicada = ultimaFuerzaAplicada
    ctx.ultimaFuerzaFriccion = ultimaFuerzaFriccion

    const trabajoAplicado = acumulados?.trabajoAplicado ?? 0
    const trabajoFriccion = acumulados?.trabajoFriccion ?? 0
    const trabajoNeto = trabajoAplicado + trabajoFriccion // W_neto = W_aplicado + W_fric

    this.actualizarMetrica('tiempo', tiempoActual, tiempoActual)
    this.actualizarMetrica('trabajo_aplicado', tiempoActual, trabajoAplicado) // W = ∑F(x)·Δx
    this.actualizarMetrica('trabajo_friccion', tiempoActual, trabajoFriccion) // W_fric = F_fric·Δx
    this.actualizarMetrica('trabajo_neto', tiempoActual, trabajoNeto)
    this.actualizarMetrica('fuerza_actual', tiempoActual, ultimaFuerzaAplicada)
    this.actualizarMetrica('distancia', tiempoActual, caja.posicion)
    this.actualizarMetrica('velocidad', tiempoActual, caja.velocidad) // v = v0 + a·dt

    if (huboMovimiento) {
      this.actualizarGrafica('trabajo_vs_distancia', caja.posicion, trabajoNeto)
      this.actualizarGrafica('fuerza_vs_distancia', caja.posicion, ultimaFuerzaAplicada)
    }

    if (distanciaMeta > 0 && caja.posicion >= distanciaMeta - 1e-6) {
      caja.posicion = distanciaMeta
      caja.completada = true
    }

    if (caja.completada) {
      if (!ctx.resumenRegistrado) {
        this._registrarResumenTrabajo(ctx, {
          tiempo: tiempoActual,
          trabajoAplicado,
          trabajoFriccion,
          trabajoNeto,
          fuerzaFinal: ultimaFuerzaAplicada,
        })
      }
      this.finalizar()
    } else if (ctx.bloqueadoPorFriccion) {
      this.pausar()
    } else {
      ctx.bloqueadoPorFriccion = false
    }
  }
  // Avance del modo de fuerzas conservativas (montaña rusa) 
  _actualizarFuerzasConservativas(dt, tiempoActual) {
    const ctx = this._contextoConservativo
    if (!ctx || !ctx.bola || !ctx.suelo) return

    const bola = ctx.bola
    const alturaSuelo = ctx.suelo?.obtenerAltura?.() ?? 0

    const resultado = this.movimientoConservativo.avanzar({
      objeto: bola,
      deltaTiempo: dt,
      alturaSuelo,
      contexto: ctx,
    })

    this.actualizarMetrica('tiempo', tiempoActual, tiempoActual)
    this.actualizarMetrica('altura', tiempoActual, resultado.altura)
    this.actualizarMetrica('velocidad', tiempoActual, resultado.velocidad)
    this.actualizarMetrica('aceleracion', tiempoActual, ctx.gravedad ?? G)
    this.actualizarMetrica('trabajo_gravedad', tiempoActual, resultado.trabajoTotal) // W_g = m·g·Δh
    this.actualizarMetrica('energia_potencial', tiempoActual, resultado.energiaPotencial) // U = m·g·h
    this.actualizarMetrica('energia_cinetica', tiempoActual, resultado.energiaCinetica) // K = ½·m·v²
    this.actualizarMetrica('energia_mecanica', tiempoActual, resultado.energiaMecanica) // Em = U + K

    this.actualizarGrafica('altura_vs_tiempo', tiempoActual, resultado.altura)
    this.actualizarGrafica('velocidad_vs_tiempo', tiempoActual, resultado.velocidad)
    this.actualizarGrafica('energia_mecanica_vs_tiempo', tiempoActual, resultado.energiaMecanica)

    ctx.alturaFinal = resultado.altura
    ctx.velocidadFinal = resultado.velocidad
    ctx.energiaMecanicaActual = resultado.energiaMecanica
    ctx.trabajoTotal = resultado.trabajoTotal

    if (resultado.completada && !ctx.resumenRegistrado) {
      ctx.velocidadFinal = resultado.velocidadImpacto ?? resultado.velocidad ?? 0
      this._registrarResumenFuerzasConservativas(ctx, tiempoActual)
      this.finalizar()
    }
  }

  //  Avance del modo del modo potencia 
  _actualizarPotencia(dt, tiempoActual) {
    const ctx = this._contextoPotencia
    if (!ctx) return

    const { masaKg, alturaM, rapido, lento } = ctx

    const actualizarCaja = (registro) => {
      const { caja, tiempoObjetivo } = registro
      if (caja.completada) {
        return {
          trabajo: masaKg * G * alturaM,
          potencia: tiempoObjetivo > 0 ? (masaKg * G * alturaM) / tiempoObjetivo : 0,
        }
      }

      registro.tiempoAcumulado += dt
      const ratio = Math.min(1, registro.tiempoAcumulado / tiempoObjetivo)
      const posicion = alturaM * ratio
      const velocidad = tiempoObjetivo > 0 ? alturaM / tiempoObjetivo : 0
      const trabajo = masaKg * G * posicion

      caja.posicion = posicion
      caja.velocidad = velocidad
      const meta = Number(caja.distanciaMeta)
      if (Number.isFinite(meta) && meta > 0 && caja.posicion >= meta) {
        caja.posicion = meta
        caja.velocidad = 0
        caja.completada = true
      } else if (ratio >= 1) {
        caja.completada = true
      }

      return {
        trabajo,
        potencia: registro.tiempoAcumulado > 0 ? trabajo / registro.tiempoAcumulado : 0,
      }
    }

    const rapidoInfo = actualizarCaja(rapido)
    const lentoInfo = actualizarCaja(lento)

    this.actualizarMetrica('tiempo', tiempoActual, tiempoActual)
    this.actualizarMetrica('potencia_rapida', tiempoActual, rapidoInfo.potencia) // P = W/T
    this.actualizarMetrica('potencia_lenta', tiempoActual, lentoInfo.potencia)
    this.actualizarMetrica('trabajo_total', tiempoActual, rapidoInfo.trabajo) // W = m·g·h alcanzada
    this.actualizarMetrica('altura_rapida', tiempoActual, rapido.caja.posicion)
    this.actualizarMetrica('altura_lenta', tiempoActual, lento.caja.posicion)
    this.actualizarGrafica('potencia_vs_tiempo_rapida', tiempoActual, rapidoInfo.potencia)
    this.actualizarGrafica('potencia_vs_tiempo_lenta', tiempoActual, lentoInfo.potencia)

    if (rapido.caja.completada && lento.caja.completada) {
      if (!ctx.resumenRegistrado) {
        this._registrarResumenPotencia(ctx, tiempoActual, rapidoInfo, lentoInfo)
      }
      this.finalizar()
    }
  }

  // Avance del modo energía cinética
  _actualizarEnergia(dt, tiempoActual) {
    const ctx = this._contextoEnergia
    if (!ctx) return
    const { vehiculo, fuerzaPropulsora, distanciaMetaM, masaKg, velocidadFinalMs } = ctx

    if (!vehiculo.completado) {
      this.movimientoCinetico.aplicar(vehiculo, fuerzaPropulsora, dt)
      if (distanciaMetaM > 0 && vehiculo.distanciaRecorrida >= distanciaMetaM) {
        vehiculo.actualizarEstado({
          distanciaRecorrida: distanciaMetaM,
          posX: distanciaMetaM,
          velocidad: velocidadFinalMs,
          energiaCinetica: 0.5 * masaKg * velocidadFinalMs * velocidadFinalMs,
          completado: true,
        })
      }
    }

    this.actualizarMetrica('tiempo', tiempoActual, tiempoActual)
    this.actualizarMetrica('energia_cinetica', tiempoActual, vehiculo.energiaCinetica) // K = ½·m·v²
    this.actualizarMetrica('velocidad', tiempoActual, vehiculo.velocidad) // v = v0 + a·dt
    this.actualizarMetrica('distancia', tiempoActual, vehiculo.distanciaRecorrida)
    this.actualizarGrafica('energia_vs_tiempo', tiempoActual, vehiculo.energiaCinetica)
    this.actualizarGrafica('velocidad_vs_tiempo', tiempoActual, vehiculo.velocidad)

    if (vehiculo.completado) {
      if (!ctx.resumenRegistrado) {
        this._registrarResumenEnergia(ctx, tiempoActual)
      }
      this.finalizar()
    }
  }

  
// ---------------------------------------------------------------------------
// Resultados
// ---------------------------------------------------------------------------

  // Expuesto a la UI para permitir que el usuario borre filas de la tabla final.
  eliminarResumen(indice) {
    this.resultado.eliminarFilaResumen(indice)
  }

  // Devuelve un snapshot del estado final (tabla, gráficas, interpretación) que la plantilla muestra en el modal de resultados.
  obtenerResultados() {
    return this.resultado.generar(this)
  }
}
