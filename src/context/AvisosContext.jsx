import { useCallback, useMemo, useState } from 'react'
import { AvisosContext } from './contextos.js'

// Confirmaciones breves ("Evento creado", "Gestión movida a mañana").
// Van en una región aria-live para que un lector de pantalla las anuncie.

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const cerrar = useCallback((id) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const avisar = useCallback((texto) => {
    const id = `${Date.now()}-${Math.random()}`
    setAvisos((prev) => [...prev, { id, texto }].slice(-2))
    setTimeout(() => cerrar(id), 4000)
  }, [cerrar])

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="toast">
            <span className="toast__texto">{a.texto}</span>
            <button
              type="button"
              className="toast__cerrar"
              onClick={() => cerrar(a.id)}
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}