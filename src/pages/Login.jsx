import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const nav = useNavigate()
  const location = useLocation()
  const { autenticar, registrar, estaAutenticado, cargando } = useAuth()
  const [modo, setModo] = useState('login') // login | registro
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (estaAutenticado && !cargando) {
      const destino = location.state?.desde ?? '/inicio'
      nav(destino, { replace: true })
    }
  }, [estaAutenticado, cargando, nav, location.state])

  const limpiarEstado = () => {
    setNombre('')
    setCorreo('')
    setClave('')
    setError('')
  }

  const manejarCambioModo = (nuevoModo) => {
    if (modo !== nuevoModo) {
      setModo(nuevoModo)
      limpiarEstado()
    }
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()
    if (!correo.trim()) { setError('Ingresa tu correo.'); return }
    if (!clave.trim()) { setError('Ingresa tu contraseña.'); return }
    if (modo === 'registro' && !nombre.trim()) { setError('Ingresa tu nombre.'); return }

    setProcesando(true)
    setError('')
    try {
      if (modo === 'login') {
        await autenticar({ correo, clave })
      } else {
        await registrar({ nombre, correo, clave })
      }
      const destino = location.state?.desde ?? '/inicio'
      nav(destino, { replace: true })
    } catch (err) {
      const mensaje = err?.datos?.mensaje || err?.message || 'No se pudo completar la solicitud.'
      setError(mensaje)
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) {
    return (
      <section className="grid place-items-center py-12 text-slate-600">
        Verificando sesión...
      </section>
    )
  }

  return (
    <section className="grid place-items-center">
      <form onSubmit={manejarSubmit} className="card w-[min(95%,420px)] grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className={`btn btn-outline ${modo === 'login' ? 'btn-active' : ''}`}
              onClick={() => manejarCambioModo('login')}
            >
              Acceder
            </button>
            <button
              type="button"
              className={`btn btn-outline ${modo === 'registro' ? 'btn-active' : ''}`}
              onClick={() => manejarCambioModo('registro')}
            >
              Registrarse
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600 m-0">
          {modo === 'login'
            ? 'Ingresa con tu cuenta para continuar con las simulaciones.'
            : 'Completa tus datos para crear una cuenta de estudiante.'}
        </p>

        {modo === 'registro' && (
          <label className="text-sm text-slate-700">Nombre
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>
        )}

        <label className="text-sm text-slate-700">Correo
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
        </label>

        <label className="text-sm text-slate-700">Contraseña
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="••••••••"
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <div className="text-rose-600 text-sm">{error}</div>}

        <div className="flex gap-2 justify-end mt-1">
          <button type="submit" className="btn btn-green" disabled={procesando}>
            {procesando ? 'Enviando...' : (modo === 'login' ? 'Entrar' : 'Registrar')}
          </button>
        </div>
        <small className="text-slate-500">
          {modo === 'login'
            ? '¿Primera vez aquí? Cambia a “Registrarse” para crear tu cuenta.'
            : '¿Ya tienes cuenta? Usa “Acceder” para iniciar sesión.'}
        </small>
      </form>
    </section>
  )
}
