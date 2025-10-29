import React from 'react'
import { Link, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Niveles from './pages/Niveles.jsx'
import ContenidoTematico from './pages/ContenidoTematico.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import Inicio from './pages/Inicio.jsx'
import Login from './pages/Login.jsx'
import LevelPage from './pages/LevelPage.jsx'
import HistorialSimulaciones from './pages/HistorialSimulaciones.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import { useAuth } from './context/AuthContext.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import GestionUsuarios from './pages/admin/GestionUsuarios.jsx'
import GestionContenido from './pages/admin/GestionContenido.jsx'
import ReportesAdmin from './pages/admin/ReportesAdmin.jsx'

export default function App() {
  const loc = useLocation()
  const nav = useNavigate()
  const { estaAutenticado, usuario, cerrarSesion } = useAuth()
  const path = loc.pathname || ''
  const inNiveles = path.startsWith('/niveles')
  const inContenido = path.startsWith('/contenido')
  const inHistorial = path.startsWith('/historial')
  const inAdmin = path.startsWith('/admin')
  const inLogin = path === '/login'
  const esAdmin = usuario?.rol === 'ADMIN'

  const manejarSalir = () => {
    cerrarSesion()
    nav('/login', { replace: true })
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4">
      <header className="header-bar rounded-b-xl">
        <h1 className="header-title">Simulador de Física Enerwork </h1>
        {estaAutenticado && !inLogin && (
          <>
            <div className="absolute left-4 top-2 flex items-center gap-3">
              <nav className="flex gap-2 flex-wrap">
                <Link className={`btn btn-outline ${path === '/inicio' ? 'btn-active' : ''}`} to="/inicio">Inicio</Link>
                <Link className={`btn btn-outline ${inNiveles ? 'btn-active' : ''}`} to="/niveles">Niveles</Link>
                <Link className={`btn btn-outline ${inContenido ? 'btn-active' : ''}`} to="/contenido">Contenido</Link>
                <Link className={`btn btn-outline ${inHistorial ? 'btn-active' : ''}`} to="/historial">Historial</Link>
                {esAdmin && (
                  <Link className={`btn btn-outline ${inAdmin ? 'btn-active' : ''}`} to="/admin/usuarios">Admin</Link>
                )}
              </nav>
            </div>
            <div className="absolute right-4 top-2 flex items-center gap-2 text-sm">
              <span className="text-slate-100">Hola, {usuario?.nombre ?? 'Estudiante'}{esAdmin ? ' (Admin)' : ''}</span>
              <button className="btn btn-outline" onClick={manejarSalir}>Salir</button>
            </div>
          </>
        )}
      </header>
      <main className="mt-4">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={estaAutenticado ? '/inicio' : '/login'} replace />}
          />
          <Route path="/login" element={<Login />} />
          <Route
          path="/inicio"
            element={<RutaProtegida><Inicio /></RutaProtegida>}
          />
          <Route
            path="/niveles"
            element={<RutaProtegida><Niveles /></RutaProtegida>}
          />
          <Route
            path="/niveles/:id"
            element={<RutaProtegida><LevelPage /></RutaProtegida>}
          />
          <Route
            path="/resultados"
            element={<RutaProtegida><ResultsPage /></RutaProtegida>}
          />
          <Route
            path="/contenido"
            element={<RutaProtegida><ContenidoTematico /></RutaProtegida>}
          />
          <Route
            path="/historial"
            element={<RutaProtegida><HistorialSimulaciones /></RutaProtegida>}
          />
          <Route
            path="/admin"
            element={(
              <RutaProtegida roles={['ADMIN']}>
                <AdminLayout />
              </RutaProtegida>
            )}
          >
            <Route index element={<Navigate to="/admin/usuarios" replace />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
            <Route path="contenido" element={<GestionContenido />} />
            <Route path="reportes" element={<ReportesAdmin />} />
          </Route>
        </Routes>
      </main>
      <footer className="text-slate-500 text-sm py-6 text-center">
        Universidad de la Amazonia
      </footer>
    </div>
  )
}
