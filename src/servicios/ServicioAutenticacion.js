import { configurarTokenAcceso, solicitar } from './ClienteApi.js'

export const ClavesAlmacenamiento = {
  usuario: 'sim2_usuario',
  token: 'sim2_token',
  refresh: 'sim2_refresh',
}

export async function registrarUsuario({ nombre, correo, clave }) {
  const respuesta = await solicitar({
    ruta: '/autenticacion/registro',
    metodo: 'POST',
    cuerpo: { nombre, correo, clave },
  })
  persistirSesion(respuesta)
  return respuesta
}

export async function iniciarSesion({ correo, clave }) {
  const respuesta = await solicitar({
    ruta: '/autenticacion/inicio-sesion',
    metodo: 'POST',
    cuerpo: { correo, clave },
  })
  persistirSesion(respuesta)
  return respuesta
}

export async function refrescarSesion(refreshToken) {
  if (!refreshToken) throw new Error('No hay token de refresco disponible.')
  const respuesta = await solicitar({
    ruta: '/autenticacion/refrescar',
    metodo: 'POST',
    cuerpo: { token: refreshToken },
  })
  almacenarTokens(respuesta.token, respuesta.refresh ?? refreshToken)
  return respuesta
}

export function cerrarSesion() {
  configurarTokenAcceso(null)
  window.localStorage.removeItem(ClavesAlmacenamiento.usuario)
  window.localStorage.removeItem(ClavesAlmacenamiento.token)
  window.localStorage.removeItem(ClavesAlmacenamiento.refresh)
}

export function obtenerSesionGuardada() {
  try {
    const usuario = window.localStorage.getItem(ClavesAlmacenamiento.usuario)
    const token = window.localStorage.getItem(ClavesAlmacenamiento.token)
    const refresh = window.localStorage.getItem(ClavesAlmacenamiento.refresh)
    if (!usuario || !token) return null
    configurarTokenAcceso(token)
    return {
      usuario: JSON.parse(usuario),
      token,
      refresh,
    }
  } catch (error) {
    console.warn('No se pudo recuperar la sesión previa.', error)
    return null
  }
}

function persistirSesion({ usuario, token, refresh }) {
  if (!usuario || !token) {
    throw new Error('Respuesta de autenticación incompleta.')
  }
  window.localStorage.setItem(ClavesAlmacenamiento.usuario, JSON.stringify(usuario))
  almacenarTokens(token, refresh)
}

function almacenarTokens(token, refresh) {
  window.localStorage.setItem(ClavesAlmacenamiento.token, token)
  if (refresh) {
    window.localStorage.setItem(ClavesAlmacenamiento.refresh, refresh)
  }
  configurarTokenAcceso(token)
}
