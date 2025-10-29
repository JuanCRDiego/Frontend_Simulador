import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RutaProtegida({ children, roles }) {
  const { estaAutenticado, usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <section className="grid place-items-center py-12 text-slate-600">
        Cargando sesión...
      </section>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  if (roles && Array.isArray(roles) && roles.length > 0) {
    const rolUsuario = usuario?.rol
    if (!rolUsuario || !roles.includes(rolUsuario)) {
      return <Navigate to="/inicio" replace />
    }
  }

  return children
}
