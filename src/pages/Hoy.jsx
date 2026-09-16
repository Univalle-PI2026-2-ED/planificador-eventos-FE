import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './hoy.css'

// TODO: reemplazar por fetch real a la API (Backend) cuando esté desplegada.
const MOCK_EVENTOS = [
  { id: '1', titulo: 'Reunión de acuerdos', hora: '09:00', hecho: false },
  { id: '2', titulo: 'Revisar checklist de accesibilidad', hora: '11:30', hecho: true },
  { id: '3', titulo: 'Sync con Backend', hora: '23:00', hecho: false },
  { id: '4', titulo: 'Reunión de equipo', hora: '22:00', hecho: false },
]

const UMBRAL_URGENTE_MIN = 60 // minutos: si falta menos de esto, es "urgente"

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

function fetchEventosDeHoy() {
  // Simulación de llamada a red. Cambia MODE abajo para ver los 3 estados.
  const MODE = 'exito' // 'exito' | 'vacio' | 'error'
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (MODE === 'error') reject(new Error('No se pudo cargar tu día'))
      else if (MODE === 'vacio') resolve([])
      else resolve(MOCK_EVENTOS)
    }, 400)
  })
}

export default function Hoy() {
  const [estado, setEstado] = useState('cargando') // cargando | vacio | exito | error
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    setEstado('cargando')
    fetchEventosDeHoy()
      .then((data) => {
        setEventos(data)
        setEstado(data.length === 0 ? 'vacio' : 'exito')
      })
      .catch(() => setEstado('error'))
  }, [])

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
