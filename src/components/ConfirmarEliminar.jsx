import { useEffect, useRef } from 'react'

// US-03: eliminar (evento o subtarea logística) siempre pide confirmación
// antes de aplicar el cambio. `elemento` es lo que se va a borrar (o null si
// el diálogo debe estar cerrado); `titulo`/`texto` describen qué se pierde.
export default function ConfirmarEliminar({ elemento, titulo, texto, onConfirmar, onCerrar }) {
  const ref = useRef(null)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (elemento) {
      if (!dlg.open) dlg.showModal()
    } else if (dlg.open) {
      dlg.close()
    }
  }, [elemento])

  if (!elemento) return <dialog className="dialogo" ref={ref} onClose={onCerrar} />

  return (
    <dialog className="dialogo" ref={ref} onClose={onCerrar} aria-labelledby="dlg-eliminar-titulo">
      <div className="dialogo__header">
        <h2 className="dialogo__titulo" id="dlg-eliminar-titulo">{titulo}</h2>
        <p className="dialogo__texto">{texto}</p>
      </div>

      <div className="dialogo__pie">
        <button type="button" className="btn btn--fantasma" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="btn btn--peligro" onClick={onConfirmar}>Eliminar</button>
      </div>
    </dialog>
  )
}