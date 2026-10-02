import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import Evento from './pages/Evento.jsx'
import EditarEvento from './pages/EditarEvento.jsx'
import Progreso from './pages/Progreso.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { EventosProvider } from './context/EventosContext.jsx'
import { AvisosProvider } from './context/AvisosContext.jsx'

// Si no hay sesión, cualquier ruta privada manda al login.
function RutaPrivada() {
  const { autenticado } = useAuth()
  if (!autenticado) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <AuthProvider>
      <EventosProvider>
        <AvisosProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route element={<RutaPrivada />}>
                <Route path="/" element={<Navigate to="/hoy" replace />} />
                <Route path="/hoy" element={<Hoy />} />
                <Route path="/crear" element={<Crear />} />
                <Route path="/evento/:id" element={<Evento />} />
                <Route path="/evento/:id/editar" element={<EditarEvento />} />
                <Route path="/progreso" element={<Progreso />} />
                <Route path="*" element={<Navigate to="/hoy" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AvisosProvider>
      </EventosProvider>
    </AuthProvider>
  )
}