import React, { useCallback, useRef } from 'react'

import { PlantillaSimulacion } from './PlantillaSimulacion.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { guardarResultadoSimulacion } from '../servicios/ServicioSimulaciones.js'
import {
  crearConfigPotencia,
  crearConfigEnergia,
  crearConfigFuerzasConservativas,
  crearConfigTrabajoConstante,
  crearConfigTrabajoVariable,
} from './config/index.js'

const CONFIGS = {
  'trabajo-constante': crearConfigTrabajoConstante(),
  'trabajo-variable': crearConfigTrabajoVariable(),
  potencia: crearConfigPotencia(),
  'energia-cinetica': crearConfigEnergia(),
  'fuerzas-conservativas': crearConfigFuerzasConservativas(),
}

CONFIGS.trabajo = CONFIGS['trabajo-constante']
CONFIGS.conservativas = CONFIGS['fuerzas-conservativas']

function limpiarResumenParaGuardar(resumen) {
  if (!resumen) return null
  const limpio = {
    tipo: resumen.tipo,
    metricasTiempoReal: Array.isArray(resumen.metricasTiempoReal)
      ? resumen.metricasTiempoReal.map((m) => ({ ...m }))
      : [],
    resumenDominio: null,
  }

  const dominio = resumen.resumenDominio
  if (dominio) {
    const tabla = dominio.tabla
    limpio.resumenDominio = {
      tabla: tabla
        ? {
            columnas: Array.isArray(tabla.columnas) ? tabla.columnas.slice() : [],
            filas: Array.isArray(tabla.filas)
              ? tabla.filas.map((fila) => (Array.isArray(fila) ? fila.slice() : fila))
              : [],
          }
        : null,
      metricasResumen: Array.isArray(dominio.metricasResumen)
        ? dominio.metricasResumen.map((m) => ({ ...m }))
        : [],
      interpretacion: dominio.interpretacion ?? '',
    }
  }

  return limpio
}

export default function SimulacionGeneral({ modo, estudiante, nivel }) {
  const config = CONFIGS[modo]
  const referenciaEscena = useRef(null)
  const { estaAutenticado, usuario } = useAuth()

  if (!config) {
    throw new Error(`Simulación no soportada: ${modo}`)
  }

  const parametrosIniciales = useCallback(() => config.parametrosIniciales(), [config])
  const crearSimulacion = ({ parametros }) => config.crearSimulacion({ parametros, estudiante })
  const nivelId = nivel?.id ?? nivel?.numero ?? null

  
  const manejarFinalizacion = useCallback(async ({ resumen, parametros }) => {
    if (!nivelId || !estaAutenticado) return
    if (usuario?.rol === 'ADMIN') return
    try {
      const resumenLimpio = limpiarResumenParaGuardar(resumen)
      await guardarResultadoSimulacion({
        nivelId,
        resumen: resumenLimpio,
        parametros,
      })
    } catch (error) {
      console.warn('No se pudo guardar el resultado de la simulación.', error)
    }
  }, [nivelId, estaAutenticado, usuario?.rol])

  return (
    <PlantillaSimulacion
      titulo={config.titulo}
      instrucciones={config.instrucciones}
      seriesEsperadas={config.seriesEsperadas}
      parametrosIniciales={parametrosIniciales}
      crearSimulacion={crearSimulacion}
      renderPanelParametros={config.renderPanelParametros}
      renderEscena={(props) => config.renderEscena({ ...props, referencia: referenciaEscena })}
      renderPanelResultados={config.renderPanelResultados}
      onFinalizarSimulacion={manejarFinalizacion}
    />
  )
}
