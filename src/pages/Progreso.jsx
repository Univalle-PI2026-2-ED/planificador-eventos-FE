import './progreso.css'

// TODO: reemplazar por datos reales de la API.
const RESUMEN = { hechos: 1, total: 3 }

export default function Progreso() {
  const porcentaje = Math.round((RESUMEN.hechos / RESUMEN.total) * 100)

  return (
    <div className="progreso">
      <h1>Progreso</h1>
      <div className="barra">
        <div className="barra__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="mono progreso__texto">
        {RESUMEN.hechos} de {RESUMEN.total} eventos completados ({porcentaje}%)
      </p>
    </div>
  )
}
