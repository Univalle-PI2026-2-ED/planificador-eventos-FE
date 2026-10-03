import { useCallback, useMemo, useState } from 'react'
import { AvisosContext } from './contextos.js'

// Confirmaciones breves ("Evento creado", "Gestión movida a mañana").
// Van en una región aria-live para que un lector de pantalla las anuncie.

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((texto) => {
    const id = `${Date.now()}-${Math.random()}`
    setAvisos((prev) => [...prev, { id, texto }])
    setTimeout(() => {
      setAvisos((prev) => prev.filter((a) => a.id !== id))
    }, 2800)
  }, [])

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <p key={a.id} className="toast">{a.texto}</p>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}