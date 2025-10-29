const BASE_API = import.meta.env?.VITE_API_URL ?? 'http://localhost:4000/api'

let tokenAcceso = null

export function configurarTokenAcceso(token) {
  tokenAcceso = token || null
}

export async function solicitar({ ruta, metodo = 'GET', cuerpo, token, cabeceras = {} }) {
  const destino = ruta.startsWith('http') ? ruta : `${BASE_API}${ruta}`
  const headers = { Accept: 'application/json', ...cabeceras }

  const tokenEnviar = token ?? tokenAcceso
  if (tokenEnviar) {
    headers.Authorization = `Bearer ${tokenEnviar}`
  }

  const opciones = { method: metodo, headers }

  if (cuerpo !== undefined && cuerpo !== null) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    opciones.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)
  }

  const respuesta = await fetch(destino, opciones)
  const texto = await respuesta.text()
  let datos = null
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch (error) {
      // Mantener texto original si no es JSON
      datos = texto
    }
  }

  if (!respuesta.ok) {
    const mensaje = typeof datos === 'object' && datos !== null
      ? datos.mensaje || 'Error en la solicitud'
      : 'Error en la solicitud'
    const error = new Error(mensaje)
    error.datos = datos
    error.estado = respuesta.status
    throw error
  }

  return datos
}

export async function descargarArchivo({ ruta, metodo = 'GET', cuerpo, token }) {
  const destino = ruta.startsWith('http') ? ruta : `${BASE_API}${ruta}`
  const headers = {}
  const tokenEnviar = token ?? tokenAcceso
  if (tokenEnviar) headers.Authorization = `Bearer ${tokenEnviar}`

  const opciones = { method: metodo, headers }
  if (cuerpo) {
    headers['Content-Type'] = 'application/json'
    opciones.body = JSON.stringify(cuerpo)
  }

  const respuesta = await fetch(destino, opciones)
  if (!respuesta.ok) {
    const mensaje = await respuesta.text()
    throw new Error(mensaje || 'No se pudo descargar el archivo.')
  }
  return respuesta.blob()
}
