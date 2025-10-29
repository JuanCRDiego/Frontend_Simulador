import React, { useEffect, useState } from 'react'
import { listarUsuarios, crearUsuario, cambiarEstadoUsuario, actualizarUsuario } from '../../servicios/ServicioUsuarios.js'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [formulario, setFormulario] = useState({
    nombre: '',
    correo: '',
    clave: '',
    rol: 'ESTUDIANTE',
    estado: 'ACTIVO',
  })
  const [procesando, setProcesando] = useState(false)

  const cargarUsuarios = async () => {
    try {
      setCargando(true)
      setError('')
      const datos = await listarUsuarios()
      setUsuarios(datos)
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo cargar la lista de usuarios.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const handleCrear = async (e) => {
    e.preventDefault()
    if (!formulario.nombre.trim() || !formulario.correo.trim() || !formulario.clave.trim()) {
      setError('Completa nombre, correo y clave.')
      return
    }
    setProcesando(true)
    setError('')
    try {
      await crearUsuario(formulario)
      setFormulario({ nombre: '', correo: '', clave: '', rol: 'ESTUDIANTE', estado: 'ACTIVO' })
      await cargarUsuarios()
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo crear el usuario.')
    } finally {
      setProcesando(false)
    }
  }

  const alternarEstado = async (usuario) => {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    try {
      await cambiarEstadoUsuario(usuario.id, nuevoEstado)
      await cargarUsuarios()
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo cambiar el estado.')
    }
  }

  const alternarRol = async (usuario) => {
    const nuevoRol = usuario.rol === 'ADMIN' ? 'ESTUDIANTE' : 'ADMIN'
    try {
      await actualizarUsuario(usuario.id, { rol: nuevoRol })
      await cargarUsuarios()
    } catch (err) {
      setError(err?.datos?.mensaje || err?.message || 'No se pudo actualizar el rol.')
    }
  }

  return (
    <section className="grid gap-4">
      <header className="card">
        <h2 className="text-lg font-semibold text-slate-800">Gestión de usuarios</h2>
        <p className="text-sm text-slate-600 m-0">
          Administra cuentas de estudiantes y administradores. Puedes crear usuarios manualmente,
          activar/inactivar cuentas y cambiar roles.
        </p>
      </header>

      <section className="card">
        <h3 className="text-base font-semibold text-slate-800">Crear nuevo usuario</h3>
        <form className="mt-2 grid gap-3" onSubmit={handleCrear}>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Nombre
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formulario.nombre}
                onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Correo
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                type="email"
                value={formulario.correo}
                onChange={(e) => setFormulario(prev => ({ ...prev, correo: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Clave temporal
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                type="password"
                value={formulario.clave}
                onChange={(e) => setFormulario(prev => ({ ...prev, clave: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
              <label>
                Rol
                <select
                  className="mt-1 w-full border rounded px-2 py-2"
                  value={formulario.rol}
                  onChange={(e) => setFormulario(prev => ({ ...prev, rol: e.target.value }))}
                >
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
              <label>
                Estado
                <select
                  className="mt-1 w-full border rounded px-2 py-2"
                  value={formulario.estado}
                  onChange={(e) => setFormulario(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </label>
            </div>
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <div className="flex justify-end">
            <button className="btn btn-green" type="submit" disabled={procesando}>
              {procesando ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Usuarios registrados</h3>
        {cargando ? (
          <p className="text-sm text-slate-600">Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-slate-600">No hay usuarios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla-resumen">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado en</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.correo}</td>
                    <td>{usuario.rol}</td>
                    <td>{usuario.estado}</td>
                    <td>{formatearFecha(usuario.creadoEn)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-outline btn-xs" onClick={() => alternarEstado(usuario)}>
                          {usuario.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="btn btn-outline btn-xs" onClick={() => alternarRol(usuario)}>
                          {usuario.rol === 'ADMIN' ? 'Hacer Estudiante' : 'Hacer Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

function formatearFecha(valor) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleString()
}
