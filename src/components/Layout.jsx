import { NavLink, Outlet } from 'react-router-dom'
import './layout.css'

const TABS = [
  { to: '/hoy', label: 'Hoy' },
  { to: '/crear', label: 'Crear' },
  { to: '/progreso', label: 'Progreso' },
]

export default function Layout() {
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">hoy</span>
        <span className="mono date">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
