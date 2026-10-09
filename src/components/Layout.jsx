import { useState } from 'react'
import { useAuth, useEventos } from '../context/contextos.js'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { fechaLarga, hoyISO } from '../lib/fechas.js'
import './layout.css'

const TABS = [
  { to: '/hoy', label: 'Hoy' },
  { to: '/crear', label: 'Crear' },
  { to: '/progreso', label: 'Progreso' },
  { to: '/configuracion', label: 'Configuración' },
]

export default function Layout() {
  const { gestionesDelDia } = useEventos()
  const { cerrarSesion } = useAuth()
  const pendientes = gestionesDelDia(hoyISO()).filter((g) => g.estado !== 'hecho').length
  const [sidebarAbierta, setSidebarAbierta] = useState(true)

  return (
    <div className={'shell' + (sidebarAbierta ? '' : ' shell--sidebar-cerrada')}>
      <a className="saltar" href="#contenido">Saltar al contenido</a>

      <header className="topbar">
        <div className="topbar__izq">
          <button
            type="button"
            className="topbar__toggle"
            onClick={() => setSidebarAbierta((abierta) => !abierta)}
            aria-expanded={sidebarAbierta}
            aria-controls="menu-principal"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Mostrar u ocultar el menú</span>
          </button>
          <Link to="/hoy" className="brand">Chronos</Link>
        </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <p className="date">{fechaLarga(hoyISO())}</p>
          <button type="button" className="btn--texto" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="content" id="contenido" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="tabbar" id="menu-principal" aria-label="Secciones de la aplicación">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}
          >
            {t.label}
            {t.to === '/hoy' && pendientes > 0 && (
              <span className="tab__contador">
                {pendientes}
                <span className="sr-only"> gestiones pendientes</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
