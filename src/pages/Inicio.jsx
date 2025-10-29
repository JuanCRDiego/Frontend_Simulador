import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Estudiante } from '../domain/base/Estudiante.js'
import { useAuth } from '../context/AuthContext.jsx'
import { listarTematicasPublicas } from '../servicios/ServicioContenido.js'

export default function Inicio() {
  const nav = useNavigate()
  const { usuario } = useAuth()
  const est = useMemo(() => {
    if (!usuario) return null
    return new Estudiante({ nombre: usuario.nombre || 'Estudiante', email: usuario.correo })
  }, [usuario])

  const niveles = useMemo(() => est?.listarNiveles?.() || [], [est])
  const [temas, setTemas] = useState([])

  useEffect(() => {
    const cargarTemas = async () => {
      try {
        const datos = await listarTematicasPublicas()
        setTemas(Array.isArray(datos) ? datos : [])
      } catch (error) {
        console.warn('No se pudieron cargar temáticas públicas.', error)
        setTemas([])
      }
    }
    cargarTemas()
  }, [])

  return (
    <section className="grid gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Bienvenido/a {est?.nombre ? `, ${est.nombre}` : ''}</h2>
        <p className="text-slate-600 text-sm">Elige por dónde empezar: explora los niveles prácticos o revisa el contenido temático para orientarte antes de simular.</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="card"><strong>Niveles disponibles:</strong> {niveles.length}</div>
          <div className="card"><strong>Temas disponibles:</strong> {temas.length}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card grid gap-2">
          <h3 className="font-semibold">Ver niveles</h3>
          <p className="text-sm text-slate-600">Accede a las simulaciones por niveles (Trabajo, Energía, Potencia, etc.).</p>
          <div><button className="btn btn-green" onClick={() => nav('/niveles')}>Ir a Niveles</button></div>
        </div>
        <div className="card grid gap-2">
          <h3 className="font-semibold">Ver contenido temático</h3>
          <p className="text-sm text-slate-600">Lee un resumen teórico y fórmulas clave de cada tema antes de simular.</p>
          <div><button className="btn btn-green" onClick={() => nav('/contenido')}>Ir a Contenido</button></div>
        </div>
      </div>
    </section>
  )
}
