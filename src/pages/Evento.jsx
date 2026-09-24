import { useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEventos } from '../context/EventosContext.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import DialogoReprogramar from '../components/DialogoReprogramar.jsx'
import ConfirmarEliminar from '../components/ConfirmarEliminar.jsx'
import { fechaLarga, formatoHoras, mayuscula, nombreDia } from '../lib/fechas.js'
import { clasificar } from '../lib/prioridad.js'
import './evento.css'

const claseSegmento = (g) => {
  if (g.estado === 'hecho') return 'segmento--hecho'
  if (g.estado === 'pospuesto') return 'segmento--pospuesto'
  return clasificar(g) === 'vencido' ? 'segmento--vencido' : ''
}

export default function Evento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { obtenerEvento, marcarGestion, guardarNota, eliminarEvento, eliminarGestion } = useEventos()
  const { avisar } = useAvisos()
  const refTitulo = useRef(null)
  const [reprogramando, setReprogramando] = useState(null)
  const [eliminandoEvento, setEliminandoEvento] = useState(false)
  const [eliminandoGestion, setEliminandoGestion] = useState(null)
  const evento = obtenerEvento(id)

  if (!evento) {
    return (
      <div className="evento-detalle vista">
        <Link to="/hoy" className="volver">Volver a hoy</Link>
        <section className="state state--vacio">
          <h2 className="state__titulo">No encontramos ese evento</h2>
          <p className="state__texto">Puede que lo hayas eliminado o que el enlace esté incompleto.</p>
          <Link to="/hoy" className="btn">Ir a tu día</Link>
        </section>
      </div>
    )
  }

  const hechas = evento.gestiones.filter((g) => g.estado === 'hecho').length
  const pct = Math.round((hechas / evento.gestiones.length) * 100)
  const dias = [...new Set(evento.gestiones.map((g) => g.fecha))].sort()

  async function alternar(gestion, marcado) {
    try {
      await marcarGestion(gestion.id, marcado ? 'hecho' : 'pendiente')
      avisar(marcado ? 'Gestión marcada como hecha' : 'Gestión reabierta')
    } catch {
      avisar('No se pudo actualizar la gestión. Intenta de nuevo.')
    }
  }

  async function confirmarEliminarEvento() {
  try {
    await eliminarEvento(evento.id)
    avisar(`Se eliminó "${evento.nombre}"`)
    setEliminandoEvento(false)
    navigate('/hoy')
  } catch {
    avisar('No se pudo eliminar el evento. Intenta de nuevo.')
  }
}


async function confirmarEliminarGestion() {
  try {
    await eliminarGestion(eliminandoGestion.id)
    avisar(`Se eliminó "${eliminandoGestion.nombre}"`)
    setEliminandoGestion(null)
    requestAnimationFrame(() => refTitulo.current?.focus())
  } catch {
    avisar('No se pudo eliminar la gestión. Intenta de nuevo.')
  }
}

  return (
    <div className="evento-detalle vista">
      <Link to="/hoy" className="volver">Volver a hoy</Link>
      <div className="detalle__header">
        <h1 ref={refTitulo} tabIndex={-1}>{evento.nombre}</h1>
        <button
          type="button"
          className="btn btn--peligro btn--sm"
          onClick={() => setEliminandoEvento(true)}
        >
          Eliminar evento
        </button>
      </div>


      <p className="detalle__meta">
        <span>{fechaLarga(evento.fecha)}</span>
        <i className="evento__punto" />
        <span>
          <span className="num">{hechas}</span> de <span className="num">{evento.gestiones.length}</span> gestiones listas
        </span>
      </p>

      <div className="progreso__barra" role="img" aria-label={`Preparación del evento al ${pct} por ciento`}>
        {evento.gestiones.map((g) => (
          <span key={g.id} className={`segmento ${claseSegmento(g)}`} />
        ))}
      </div>

      {dias.map((dia) => {
        const delDia = evento.gestiones
          .filter((g) => g.fecha === dia)
          .sort((a, b) => a.hora.localeCompare(b.hora))
        const horasDia = delDia.filter((g) => g.estado !== 'hecho').reduce((s, g) => s + g.horas, 0)

        return (
          <section key={dia}>
            <h2 className="grupo__titulo detalle__dia">
              {mayuscula(nombreDia(dia))}
              <span className="grupo__conteo">{formatoHoras(horasDia)}</span>
            </h2>

            <ul className="plan">
              {delDia.map((g) => {
                const hecho = g.estado === 'hecho'
                const vencida = clasificar(g) === 'vencido'
                return (
                  <li
                    key={g.id}
                    className={'gestion' + (hecho ? ' gestion--hecha' : '') + (vencida ? ' gestion--vencida' : '')}
                  >
                    <input
                      className="gestion__check"
                      type="checkbox"
                      id={`chk-${g.id}`}
                      checked={hecho}
                      onChange={(e) => alternar(g, e.target.checked)}
                    />
                    <label className="gestion__nombre" htmlFor={`chk-${g.id}`}>{g.nombre}</label>

                    <div className="gestion__datos">
                      <span className="num">{g.hora.slice(0, 5)}</span>
                      <i className="evento__punto" />
                      <span className="num">{formatoHoras(g.horas)}</span>
                      {g.estado === 'pospuesto' && (
                        <span className="etiqueta etiqueta--pospuesto">Pospuesta</span>
                      )}
                    </div>

                    <div className="gestion__acciones">
                      <button
                        type="button"
                        className="btn btn--fantasma btn--sm"
                        onClick={() => setReprogramando(g)}
                        aria-label={`Reprogramar ${g.nombre}`}
                      >
                        Reprogramar
                      </button>
                      <button
                        type="button"
                        className="btn btn--peligro btn--sm"
                        onClick={() => setEliminandoGestion(g)}
                        aria-label={`Eliminar ${g.nombre}`}
                      >
                        Eliminar
                      </button>
                    </div>

                    {hecho && (
                      <input
                        className="gestion__nota"
                        key={`nota-${g.id}`}
                        defaultValue={g.nota}
                        placeholder="Nota (opcional): ¿quedó algo pendiente?"
                        aria-label={`Nota de ${g.nombre}`}
                        onBlur={async (e) => {
                          if (e.target.value !== g.nota) {
                            try {
                              await guardarNota(g.id, e.target.value)
                              avisar('Nota guardada')
                            } catch {
                              avisar('No se pudo guardar la nota. Intenta de nuevo.')
                            }
                          }
                        }}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <DialogoReprogramar gestion={reprogramando} onCerrar={() => setReprogramando(null)} />
        <ConfirmarEliminar
        elemento={eliminandoEvento ? evento : null}
        titulo="¿Eliminar este evento?"
        texto={`Se eliminará “${evento.nombre}” junto con sus ${evento.gestiones.length} gestiones. Esta acción no se puede deshacer.`}
        onConfirmar={confirmarEliminarEvento}
        onCerrar={() => setEliminandoEvento(false)}
      />

      <ConfirmarEliminar
        elemento={eliminandoGestion}
        titulo="¿Eliminar esta gestión?"
        texto={eliminandoGestion ? `Se eliminará “${eliminandoGestion.nombre}” del plan de trabajo. Esta acción no se puede deshacer.` : ''}
        onConfirmar={confirmarEliminarGestion}
        onCerrar={() => setEliminandoGestion(null)}
      />
    </div>
  )
}