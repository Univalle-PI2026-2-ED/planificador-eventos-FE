import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEventos } from '../context/EventosContext.jsx'
import { fechaLarga, hoyISO } from '../lib/fechas.js'
import './layout.css'

const TABS = [
  { to: '/hoy', label: 'Hoy' },
  { to: '/crear', label: 'Crear' },
  { to: '/progreso', label: 'Progreso' },
]

export default function Layout() {
  const { gestionesDelDia } = useEventos()
  const pendientes = gestionesDelDia(hoyISO()).filter((g) => g.estado !== 'hecho').length

  return (
    <div className="shell">
      <a className="saltar" href="#contenido">Saltar al contenido</a>

      <header className="topbar">
        <Link to="/hoy" className="brand">hoy</Link>
        <p className="date">{fechaLarga(hoyISO())}</p>
      </header>

      <main className="content" id="contenido" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Secciones de la aplicación">
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
