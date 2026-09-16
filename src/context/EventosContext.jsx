import { createContext, useContext, useState } from 'react'

// TODO: cuando exista la API real, reemplazar el estado inicial por un fetch
// y agregarEvento/marcarHecho por peticiones POST/PATCH al backend.
const EVENTOS_INICIALES = [
  { id: '1', titulo: 'Reunión de acuerdos', hora: '09:00', hecho: false },
  { id: '2', titulo: 'Revisar checklist de accesibilidad', hora: '11:30', hecho: true },
  { id: '3', titulo: 'Sync con Backend', hora: '16:00', hecho: false },
]

const EventosContext = createContext(null)

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState(EVENTOS_INICIALES)

  function agregarEvento({ titulo, hora }) {
    const nuevo = {
      id: crypto.randomUUID(),
      titulo,
      hora,
      hecho: false,
    }
    setEventos((prev) => [...prev, nuevo])
    return nuevo
  }

  function marcarHecho(id, hecho = true) {
    setEventos((prev) => prev.map((ev) => (ev.id === id ? { ...ev, hecho } : ev)))
  }

  function obtenerEvento(id) {
    return eventos.find((ev) => ev.id === id)
  }

  const value = { eventos, agregarEvento, marcarHecho, obtenerEvento }

  return <EventosContext.Provider value={value}>{children}</EventosContext.Provider>
}

export function useEventos() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventos debe usarse dentro de <EventosProvider>')
  return ctx
}
