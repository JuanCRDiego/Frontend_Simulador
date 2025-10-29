import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  cerrarSesion as cerrarSesionServicio,
  iniciarSesion,
  obtenerSesionGuardada,
  registrarUsuario,
  refrescarSesion,
} from '../servicios/ServicioAutenticacion.js'
import { crearUsuarioDesdeDatos } from '../domain/base/fabricaUsuarios.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [refresh, setRefresh] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const sesion = obtenerSesionGuardada()
    if (sesion) {
      setUsuario(crearUsuarioDesdeDatos(sesion.usuario))
      setToken(sesion.token)
      setRefresh(sesion.refresh ?? null)
    }
    setCargando(false)
  }, [])

  const autenticar = async ({ correo, clave }) => {
    const resultado = await iniciarSesion({ correo, clave })
    const usuarioDominio = crearUsuarioDesdeDatos(resultado.usuario)
    setUsuario(usuarioDominio)
    setToken(resultado.token)
    setRefresh(resultado.refresh ?? null)
    return usuarioDominio
  }

  const registrar = async ({ nombre, correo, clave }) => {
    const resultado = await registrarUsuario({ nombre, correo, clave })
    const usuarioDominio = crearUsuarioDesdeDatos(resultado.usuario)
    setUsuario(usuarioDominio)
    setToken(resultado.token)
    setRefresh(resultado.refresh ?? null)
    return usuarioDominio
  }

  const cerrarSesion = () => {
    cerrarSesionServicio()
    setUsuario(null)
    setToken(null)
    setRefresh(null)
  }

  const renovarToken = async () => {
    if (!refresh) return null
    const { token: nuevoToken, refresh: nuevoRefresh } = await refrescarSesion(refresh)
    setToken(nuevoToken)
    setRefresh(nuevoRefresh ?? refresh)
    return nuevoToken
  }

  const value = useMemo(() => ({
    usuario,
    token,
    refresh,
    cargando,
    estaAutenticado: Boolean(usuario && token),
    autenticar,
    registrar,
    cerrarSesion,
    renovarToken,
  }), [usuario, token, refresh, cargando])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
