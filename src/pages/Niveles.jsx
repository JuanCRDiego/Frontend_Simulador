import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Niveles as NivelesDomain } from '../domain/contenido/Niveles.js'
import { listarNiveles } from '../servicios/ServicioNiveles.js'

export default function Niveles() {
  const nav = useNavigate()
  const baseNiveles = useMemo(() => NivelesDomain.list().map((n) => ({
    id: n.id,
    numero: n.numero,
    nombre: n.nombre,
    desc: n.desc,
  })), [])
  const [niveles, setNiveles] = useState(baseNiveles)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const datos = await listarNiveles()
        if (!Array.isArray(datos) || datos.length === 0) return
        const convertidos = datos.map((nivel) => ({
          id: nivel.id,
          numero: nivel.numero,
          nombre: nivel.nombre,
          desc: nivel.descripcion ?? 'Sin descripción disponible.',
        }))
        setNiveles(convertidos)
      } catch (err) {
        console.warn('No se pudo cargar niveles dinámicos.', err)
        setError('Mostrando niveles predeterminados. Intenta más tarde para ver actualizaciones.')
      }
    }
    cargar()
  }, [])

  return (
    <section className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Niveles</h2>
            <p className="text-slate-600 text-sm">Selecciona un nivel para ejecutar su simulación correspondiente.</p>
          </div>
          <button className="btn btn-outline" onClick={() => nav('/inicio')}>Volver</button>
        </div>
      </div>

      {error && (
        <div className="panel-mint px-4 py-3 text-amber-600 text-sm">{error}</div>
      )}

      <div className="grid gap-3">
        {niveles.map((n) => (
          <div key={n.id} className="card flex items-center justify-between">
            <div>
              <h3 className="m-0">Nivel {n.numero}: {n.nombre}</h3>
              <p className="m-0 text-slate-600 text-sm">{n.desc}</p>
            </div>
            <Link to={`/niveles/${n.id}`} className="btn" style={{ background: '#38bdf8', color: '#001' }}>Entrar</Link>
          </div>
        ))}
      </div>
    </section>
  )
}
