import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import Evento from './pages/Evento.jsx'
import Progreso from './pages/Progreso.jsx'
import Login from './pages/Login.jsx'
import { EventosProvider } from './context/EventosContext.jsx'
import { AvisosProvider } from './context/AvisosContext.jsx'

export default function App() {
  return (
    <EventosProvider>
      <AvisosProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/hoy" replace />} />
              <Route path="/hoy" element={<Hoy />} />
              <Route path="/crear" element={<Crear />} />
              <Route path="/evento/:id" element={<Evento />} />
              <Route path="/progreso" element={<Progreso />} />
              <Route path="*" element={<Navigate to="/hoy" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AvisosProvider>
    </EventosProvider>
  )
}
