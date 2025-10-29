import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarTematicasPublicas } from '../servicios/ServicioContenido.js'

export default function ContenidoTematico() {
  const nav = useNavigate()
  const [selected, setSelected] = useState(null)
  const [temas, setTemas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const datos = await listarTematicasPublicas()
        if (!Array.isArray(datos) || datos.length === 0) {
          setTemas([])
          return
        }
        setTemas(datos.map((tematica) => ({
          id: tematica.id,
          titulo: tematica.nombre ?? 'Tema sin título',
          resumen: tematica.descripcion ?? 'Sin descripción disponible.',
          icono: tematica.icono ?? '',
          estado: tematica.estado ?? '',
          formulas: Array.isArray(tematica.formulas)
            ? tematica.formulas
            : typeof tematica.formulas === 'string'
              ? tematica.formulas.split(/\r?\n/).filter(Boolean)
              : [],
        })))
        setError('')
      } catch (err) {
        console.warn('No se pudo cargar contenido dinámico.', err)
        setError('No se pudo cargar el contenido temático. Intenta nuevamente más tarde.')
      }
    }
    cargar()
  }, [])

  return (
    <section className="grid gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Contenido temático</h2>
        <p className="text-slate-600 text-sm">Resumen teórico y fórmulas clave de cada tema para orientarte antes de ejecutar la simulación.</p>
        <div className="mt-2"><button className="btn btn-outline" onClick={() => nav('/inicio')}>Volver</button></div>
      </div>
      {error && (
        <div className="panel-mint px-4 py-3 text-amber-600 text-sm">{error}</div>
      )}
      {temas.length === 0 ? (
        <div className="panel-mint px-4 py-6 text-center text-slate-600">
          No hay temáticas registradas todavía.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {temas.map(t => (
            <article key={t.id} className="tema-card">
              <div className="tema-card-body">
                <h3 className="flex items-center gap-2">
                  {t.icono && <span className="text-2xl" aria-hidden="true">{t.icono}</span>}
                  <span>{t.titulo}</span>
                </h3>
                <p>{crearResumenBreve(t.resumen)}</p>
              </div>
              <footer className="tema-card-footer">
                <button className="btn btn-green" onClick={() => setSelected(t)}>Ver</button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <ModalDetalle
          contenido={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}

function ModalDetalle({ contenido, onClose }) {
  const bloquesDescripcion = useMemo(() => parsearDescripcion(contenido?.resumen), [contenido?.resumen])
  const formulas = Array.isArray(contenido?.formulas) ? contenido.formulas.filter(Boolean) : []

  return (
    <div className="modal-overlay">
      <article className="modal-card">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-slate-900">{contenido?.titulo}</h3>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
        </header>

        <div className="modal-scroll">
          <section className="modal-section">
            {bloquesDescripcion.length === 0 ? (
              <p className="modal-text">No se registró una descripción para esta temática.</p>
            ) : (
              bloquesDescripcion.map((bloque, idx) => (
                <BloqueDescripcion key={idx} bloque={bloque} />
              ))
            )}
          </section>

          {formulas.length > 0 && (
            <section className="modal-section">
              <h4>Fórmulas clave</h4>
              <ul className="modal-list">
                {formulas.map((formula, idx) => (
                  <li key={idx}>{formula}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}

function crearResumenBreve(texto) {
  if (!texto) return 'Descripción no disponible.'
  const lineas = texto.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean)
  const lineasLimpias = lineas
    .filter((linea) => !/:\s*$/.test(linea))
    .filter((linea) => !/^[-*•]\s+/.test(linea))
  const contenido = lineasLimpias.length > 0 ? lineasLimpias[0] : lineas[0] || texto
  if (!contenido) return 'Descripción no disponible.'
  return contenido.length <= 180 ? contenido : `${contenido.slice(0, 177)}…`
}

function esItem(linea) {
  return /^[-*•]\s+/.test(linea)
}

function normalizarItem(linea) {
  return linea.replace(/^[-*•]\s+/, '').trim()
}

function esEncabezado(linea) {
  if (!linea) return false
  const sinDosPuntos = linea.replace(/:\s*$/, '')
  return sinDosPuntos.length > 0 && sinDosPuntos !== linea
}

function parsearDescripcion(texto) {
  if (!texto || typeof texto !== 'string') return []
  const lineas = texto.split(/\r?\n/).map((linea) => linea.trim())
  const bloques = []
  let bufferParrafo = []
  let listaActual = []

  const cerrarParrafo = () => {
    if (bufferParrafo.length === 0) return
    const textoParrafo = bufferParrafo.join(' ')
    if (textoParrafo.trim()) {
      bloques.push({ tipo: 'parrafo', texto: textoParrafo.trim() })
    }
    bufferParrafo = []
  }

  const cerrarLista = () => {
    if (listaActual.length === 0) return
    bloques.push({ tipo: 'lista', items: listaActual.slice() })
    listaActual = []
  }

  lineas.forEach((linea) => {
    if (esEncabezado(linea)) {
      cerrarParrafo()
      cerrarLista()
      bloques.push({ tipo: 'encabezado', texto: linea.replace(/:\s*$/, '') })
      return
    }

    if (!linea) {
      cerrarParrafo()
      cerrarLista()
      return
    }

    if (esItem(linea)) {
      cerrarParrafo()
      listaActual.push(normalizarItem(linea))
    } else {
      cerrarLista()
      bufferParrafo.push(linea)
    }
  })

  cerrarParrafo()
  cerrarLista()

  return bloques
}

function BloqueDescripcion({ bloque }) {
  if (!bloque) return null
  if (bloque.tipo === 'encabezado') {
    return <p className="modal-heading">{bloque.texto}</p>
  }
  if (bloque.tipo === 'lista') {
    return (
      <ul className="modal-list">
        {bloque.items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }
  return <p className="modal-text">{bloque.texto}</p>
}
