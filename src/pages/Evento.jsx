import { useParams, Link } from 'react-router-dom'
import './evento.css'

export default function Evento() {
  const { id } = useParams()

  // TODO: fetch del evento real por id contra la API.

  return (
    <div className="evento-detalle">
      <Link to="/hoy" className="volver">← Volver a hoy</Link>
      <h1>Evento #{id}</h1>
      <p className="hoy__hint">Aquí va el detalle del evento cuando conectemos la API.</p>
    </div>
  )
}
