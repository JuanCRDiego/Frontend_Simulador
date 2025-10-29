import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Niveles } from '../domain/contenido/Niveles.js'
import { Estudiante } from '../domain/base/Estudiante.js'
import SimulacionGeneral from '../simulaciones/SimulacionGeneral.jsx'

export default function LevelPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const nivel = useMemo(() => Niveles.findById(id), [id])

  const volver = () => navigate('/niveles')

  const estudiante = useMemo(() => {
    if (!nivel) return null
    const instancia = new Estudiante({ nombre: 'Estudiante' })
    instancia.seleccionarNivel(nivel.id)
    return instancia
  }, [nivel?.id])

  if (!nivel) {
    return (
      <section className="card">
        <h2>Nivel no encontrado</h2>
        <button className="btn btn-outline" onClick={volver}>Volver</button>
      </section>
    )
  }

  const renderBody = () => {
    switch (Number(id)) {
      case 1:
        return <SimulacionGeneral modo="trabajo-constante" estudiante={estudiante} nivel={nivel} />
      case 2:
        return <SimulacionGeneral modo="trabajo-variable" estudiante={estudiante} nivel={nivel} />
      case 3:
        return <SimulacionGeneral modo="energia-cinetica" estudiante={estudiante} nivel={nivel} />
      case 4:
        return <SimulacionGeneral modo="potencia" estudiante={estudiante} nivel={nivel} />
      case 5:
        return <SimulacionGeneral modo="fuerzas-conservativas" estudiante={estudiante} nivel={nivel} />
      default:
        return (
          <div className="card">
            <h3 className="font-semibold">{nivel.nombre}</h3>
            <p className="text-slate-600 text-sm">{nivel.desc}</p>
            <h4 className="font-semibold mt-2">Fórmulas</h4>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {(nivel.formulas || []).map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <p className="text-slate-500 text-sm mt-2">Este nivel está en desarrollo.</p>
          </div>
        )
    }
  }

  return (
    <section className="grid gap-4">
      <div className="card flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Nivel {nivel.numero}: {nivel.nombre}</h2>
          <p className="text-slate-600 text-sm m-0">{nivel.desc}</p>
        </div>
        <button className="btn btn-outline" onClick={volver}>Volver</button>
      </div>
      {renderBody()}
    </section>
  )
}
