import React, { useEffect, useState } from 'react'
import {
  listarTematicas,
  crearTematica,
  actualizarTematica,
  eliminarTematica,
} from '../../servicios/ServicioContenido.js'

export default function GestionContenido() {
  const [tematicas, setTematicas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    icono: '',
    formulas: '',
  })
  const [procesando, setProcesando] = useState(false)

  const cargarTematicas = async () => {
    try {
      setCargando(true)
      setError('')
      const datos = await listarTematicas()
      setTematicas(datos)
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo cargar el contenido temático.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarTematicas()
  }, [])

  const limpiarFormulario = () => {
    setForm({ id: null, nombre: '', descripcion: '', icono: '', formulas: '' })
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setProcesando(true)
    setError('')
    try {
      if (form.id) {
        await actualizarTematica(form.id, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          icono: form.icono,
          formulas: form.formulas,
        })
      } else {
        await crearTematica({
          nombre: form.nombre,
          descripcion: form.descripcion,
          icono: form.icono,
          formulas: form.formulas,
        })
      }
      limpiarFormulario()
      await cargarTematicas()
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo guardar la temática.')
    } finally {
      setProcesando(false)
    }
  }

  const manejarEditar = (tematica) => {
    setForm({
      id: tematica.id,
      nombre: tematica.nombre,
      descripcion: tematica.descripcion ?? '',
      icono: tematica.icono ?? '',
      formulas: tematica.formulas ?? '',
    })
  }

  const manejarEliminar = async (tematica) => {
    const confirmar = window.confirm(`¿Eliminar la temática "${tematica.nombre}"?`)
    if (!confirmar) return
    try {
      await eliminarTematica(tematica.id)
      await cargarTematicas()
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo eliminar la temática.')
    }
  }

  return (
    <section className="grid gap-4">
      <header className="card">
        <h2 className="text-lg font-semibold text-slate-800">Contenido temático</h2>
        <p className="text-sm text-slate-600 m-0">
          Administra las temáticas disponibles para los estudiantes: puedes crear, editar o eliminar entradas.
        </p>
      </header>

      <section className="card">
        <h3 className="text-base font-semibold text-slate-800">
          {form.id ? 'Editar temática' : 'Crear nueva temática'}
        </h3>
        <form className="mt-2 grid gap-3" onSubmit={manejarSubmit}>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Nombre
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={form.nombre}
                onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Icono (opcional)
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={form.icono}
                onChange={(e) => setForm(prev => ({ ...prev, icono: e.target.value }))}
                placeholder="Ej: icono-laboratorio"
              />
            </label>
          </div>
          <label className="text-sm text-slate-700">
            Descripción
            <textarea
              className="mt-1 w-full border rounded px-3 py-2"
              rows="3"
              value={form.descripcion}
              onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            Fórmulas (opcional, separa por salto de línea)
            <textarea
              className="mt-1 w-full border rounded px-3 py-2"
              rows="3"
              value={form.formulas}
              onChange={(e) => setForm(prev => ({ ...prev, formulas: e.target.value }))}
              placeholder="Ejemplo:\nW = F·d\nP = F·v"
            />
          </label>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <div className="flex justify-end gap-2">
            {form.id && (
              <button type="button" className="btn btn-outline" onClick={limpiarFormulario}>
                Cancelar edición
              </button>
            )}
            <button className="btn btn-green" type="submit" disabled={procesando}>
              {procesando ? 'Guardando...' : form.id ? 'Actualizar temática' : 'Crear temática'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Listado de temáticas</h3>
        {cargando ? (
          <p className="text-sm text-slate-600">Cargando...</p>
        ) : tematicas.length === 0 ? (
          <p className="text-sm text-slate-600">No hay temáticas registradas.</p>
        ) : (
          <div className="grid gap-3">
            {tematicas.map((tematica) => (
              <article key={tematica.id} className="panel-mint px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 m-0">{tematica.nombre}</h4>
                    {tematica.icono && (
                      <p className="text-xs text-slate-500 m-0">
                        Icono: {tematica.icono}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-outline btn-xs" onClick={() => manejarEditar(tematica)}>Editar</button>
                    <button className="btn btn-outline btn-xs" onClick={() => manejarEliminar(tematica)}>Eliminar</button>
                  </div>
                </div>
                {tematica.descripcion && (
                  <p className="mt-2 text-sm text-slate-600">{tematica.descripcion}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
