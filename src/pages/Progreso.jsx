import { useEventos } from '../context/EventosContext.jsx'
import './progreso.css'

export default function Progreso() {
  const { eventos } = useEventos()
  const total = eventos.length
  const hechos = eventos.filter((ev) => ev.hecho).length
  const porcentaje = total === 0 ? 0 : Math.round((hechos / total) * 100)

  return (
    <div className="progreso">
      <h1>Progreso</h1>
      <div className="barra">
        <div className="barra__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="mono progreso__texto">
        {total === 0
          ? 'Todavía no tienes eventos hoy.'
          : `${hechos} de ${total} eventos completados (${porcentaje}%)`}
      </p>
    </div>
  )
}
