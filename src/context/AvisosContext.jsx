import { createContext, useCallback, useContext, useState } from 'react'

// Confirmaciones breves ("Evento creado", "Gestión movida a mañana").
// Van en una región aria-live para que un lector de pantalla las anuncie.
const AvisosContext = createContext(null)

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((texto) => {
    const id = `${Date.now()}-${Math.random()}`
    setAvisos((prev) => [...prev, { id, texto }])
    setTimeout(() => {
      setAvisos((prev) => prev.filter((a) => a.id !== id))
    }, 2800)
  }, [])

  return (
    <AvisosContext.Provider value={{ avisar }}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <p key={a.id} className="toast">{a.texto}</p>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

export function useAvisos() {
  const ctx = useContext(AvisosContext)
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>')
  return ctx
}
