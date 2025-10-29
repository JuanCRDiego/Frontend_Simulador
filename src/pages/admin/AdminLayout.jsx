import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const enlaces = [
  { to: '/admin/usuarios', etiqueta: 'Usuarios' },
  { to: '/admin/contenido', etiqueta: 'Contenido temático' },
  { to: '/admin/reportes', etiqueta: 'Reportes' },
]


export default function AdminLayout() {
  return (
    <section className="grid gap-4 md:grid-cols-[220px_auto]">
      <aside className="card p-0 overflow-hidden">
        <h2 className="px-4 py-3 text-base font-semibold border-b border-slate-200 bg-slate-50 text-slate-700">
          Panel administrador
        </h2>
        <nav className="flex flex-col">
          {enlaces.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => [
                'px-4 py-3 text-sm border-b border-slate-100 transition-colors',
                isActive ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'hover:bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {link.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="grid gap-4">
        <Outlet />
      </div>
    </section>
  )
}
