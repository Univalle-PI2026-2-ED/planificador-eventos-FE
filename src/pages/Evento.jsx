import { useParams, Link } from 'react-router-dom'
import { useEventos } from '../context/EventosContext.jsx'
import './evento.css'

export default function Evento() {
  const { id } = useParams()
  const { obtenerEvento, marcarHecho } = useEventos()
  const evento = obtenerEvento(id)

  if (!evento) {
    return (
      <div className="evento-detalle">
        <Link to="/hoy" className="volver">← Volver a hoy</Link>
        <h1>Evento no encontrado</h1>
      </div>
    )
  }

  return (
    <div className="evento-detalle">
      <Link to="/hoy" className="volver">← Volver a hoy</Link>
      <h1>{evento.titulo}</h1>
      <p className="mono hoy__hint">{evento.hora}</p>
      <button
        className="btn"
        onClick={() => marcarHecho(evento.id, !evento.hecho)}
      >
        {evento.hecho ? 'Marcar como pendiente' : 'Marcar como hecho'}
      </button>
    </div>
  )
}
