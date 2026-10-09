import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Hoy from './pages/Hoy.jsx'
import Crear from './pages/Crear.jsx'
import Evento from './pages/Evento.jsx'
import EditarEvento from './pages/EditarEvento.jsx'
import Progreso from './pages/Progreso.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/contextos.js'
import { EventosProvider } from './context/EventosContext.jsx'
import { AvisosProvider } from './context/AvisosContext.jsx'
import Configuracion from './pages/Configuracion.jsx'

// Si no hay sesión, cualquier ruta privada manda al login.
function RutaPrivada() {
  const { autenticado } = useAuth()
  if (!autenticado) return <Navigate to="/login" replace />
  return <Layout />
}

// Cada vez que se inicia o se cierra sesión, los datos empiezan de cero.
function DatosPorSesion({ children }) {
  const { autenticado } = useAuth()
  return <EventosProvider key={autenticado ? 'con-sesion' : 'sin-sesion'}>{children}</EventosProvider>
}

export default function App() {
  return (
    <AuthProvider>
      <DatosPorSesion>
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
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="*" element={<Navigate to="/hoy" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AvisosProvider>
      </DatosPorSesion>
    </AuthProvider>
  )
}