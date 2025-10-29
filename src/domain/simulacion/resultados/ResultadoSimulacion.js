import { TablaResumen } from './TablaResumen.js'
import { GraficosFinales } from './GraficosFinales.js'
import { InterpretacionResultado } from './InterpretacionResultado.js'
import { MetricasFinales } from './MetricasFinales.js'

export class ResultadoSimulacion {
  constructor({
    tabla = new TablaResumen(),
    graficos = [],
    interpretacion = new InterpretacionResultado({ texto: '' }),
    metricas = new MetricasFinales({ nombre: 'finales' }),
  } = {}) {
    this.tabla = tabla
    this.graficos = Array.isArray(graficos) ? graficos.slice() : []
    this.interpretacion = interpretacion
    this.metricas = metricas
  }

  agregarGrafico(grafico) {
    if (grafico instanceof GraficosFinales) {
      this.graficos.push(grafico)
    }
  }

  agregarMetrica(clave, valor) {
    if (!this.metricas) return
    this.metricas.setValor(clave, valor)
  }

  agregarFilaResumen({ columnas = null, fila = null } = {}) {
    if (Array.isArray(columnas) && columnas.length > 0) {
      this.tabla.establecerColumnas(columnas)
    }
    if (Array.isArray(fila)) {
      this.tabla.agregarFila(fila)
    }
  }

  eliminarFilaResumen(indice) {
    this.tabla.eliminarFila(indice)
  }

  generar(simulacion) {
    void simulacion
    return {
      tabla: this.tabla.toJSON(),
      graficos: this.graficos,
      interpretacion: this.interpretacion,
      metricas: this.metricas,
    }
  }
}
