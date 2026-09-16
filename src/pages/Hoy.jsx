import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEventos } from '../context/EventosContext.jsx'
import './hoy.css'

const UMBRAL_URGENTE_MIN = 60 // minutos: si falta menos de esto, es "urgente"

// Cambia esto a true para ver el estado "error" en las capturas de evidencia.
// TODO: cuando exista la API real, el estado "error" saldrá solo si el fetch falla.
const FORZAR_ERROR_DEMO = false

// Clasifica un evento en 'vencido' | 'urgente' | 'proximo' según la hora actual.
function clasificar(evento, ahora) {
  if (evento.hecho) return 'hecho'
  const [h, m] = evento.hora.split(':').map(Number)
  const horaEvento = new Date(ahora)
  horaEvento.setHours(h, m, 0, 0)
  const diffMin = (horaEvento - ahora) / 60000
  if (diffMin < 0) return 'vencido'
  if (diffMin <= UMBRAL_URGENTE_MIN) return 'urgente'
  return 'proximo'
}

const ETIQUETA = { vencido: 'Vencido', urgente: 'Urgente', proximo: 'Próximo' }
const PRIORIDAD = { vencido: 0, urgente: 1, proximo: 2, hecho: 3 }

export default function Hoy() {
  const { eventos } = useEventos()
  const [estado, setEstado] = useState('cargando') // cargando | vacio | exito | error

  useEffect(() => {
    setEstado('cargando')
    const t = setTimeout(() => {
      if (FORZAR_ERROR_DEMO) setEstado('error')
      else setEstado(eventos.length === 0 ? 'vacio' : 'exito')
    }, 300)
    return () => clearTimeout(t)
  }, [eventos])

  return (
    <div className="hoy">
      <div className="hoy__header">
        <h1 className="hoy__title">Tu día</h1>
        <Link to="/crear" className="btn btn--accion">+ Crear evento</Link>
      </div>

      {estado === 'cargando' && <p className="hoy__hint">Cargando…</p>}

      {estado === 'error' && (
        <div className="state state--error">
          <p>No pudimos cargar tu día.</p>
          <button onClick={() => setEstado('cargando')}>Reintentar</button>
        </div>
      )}

      {estado === 'vacio' && (
        <div className="state state--vacio">
          <p>Todavía no tienes eventos para hoy.</p>
          <Link className="btn" to="/crear">Crear el primero</Link>
        </div>
      )}

      {estado === 'exito' && (
        <ul className="lista-eventos">
          {[...eventos]
            .map((ev) => ({ ...ev, _clase: clasificar(ev, new Date()) }))
            .sort((a, b) => PRIORIDAD[a._clase] - PRIORIDAD[b._clase])
            .map((ev) => (
              <li key={ev.id}>
                <Link
                  to={`/evento/${ev.id}`}
                  className={`evento evento--${ev._clase}`}
                >
                  <span className="mono evento__hora">{ev.hora}</span>
                  <span className="evento__titulo">{ev.titulo}</span>
                  {ev._clase !== 'hecho' && (
                    <span className={`etiqueta etiqueta--${ev._clase}`}>{ETIQUETA[ev._clase]}</span>
                  )}
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
