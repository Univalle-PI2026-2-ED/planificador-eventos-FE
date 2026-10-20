import { useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEventos, useAvisos } from '../context/contextos.js'
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

// Rango de cada estado en la barra: las hechas primero, así el verde
// siempre se llena de izquierda a derecha sin importar qué gestión marques.
const ORDEN_SEGMENTO = { hecho: 0, pospuesto: 1 } // el resto (pendiente/vencida) = 2

export default function Evento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    obtenerEvento,
    guardarGestion, // una sola petición con estado y/o nota
    eliminarEvento,
    eliminarGestion,
    horasDelDia,
    limiteHoras,
  } = useEventos()
  const { avisar } = useAvisos()
  const refTitulo = useRef(null)
  const [reprogramando, setReprogramando] = useState(null)
  const [eliminandoEvento, setEliminandoEvento] = useState(false)
  const [eliminandoGestion, setEliminandoGestion] = useState(null)

  // Cambios sin guardar, por gestión: { [id]: { estado?, nota? } }.
  // Nada se envía al servidor hasta pulsar "Guardar".
  const [borradores, setBorradores] = useState({})
  const [guardando, setGuardando] = useState(null)

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
  const pct = evento.gestiones.length ? Math.round((hechas / evento.gestiones.length) * 100) : 0
  const dias = [...new Set(evento.gestiones.map((g) => g.fecha))].sort()

  // [...] copia el array para no mutar el estado del contexto.
  // El sort es estable: dentro de cada grupo se conserva el orden original.
  const segmentos = [...evento.gestiones].sort(
    (a, b) => (ORDEN_SEGMENTO[a.estado] ?? 2) - (ORDEN_SEGMENTO[b.estado] ?? 2),
  )

  // Una gestión que vuelve a pendiente (desde pospuesta o hecha) vuelve a ocupar
  // tiempo en su día: si ya no cabe, se avisa para reprogramarla.
  function sinEspacio(gestion) {
    const ocupado = horasDelDia(gestion.fecha, gestion.id)
    if (ocupado + Number(gestion.horas) <= Number(limiteHoras)) return false
    avisar(
      `${mayuscula(nombreDia(gestion.fecha))} no tiene espacio para «${gestion.nombre}» ` +
        `(${formatoHoras(ocupado)} planeadas, límite ${formatoHoras(limiteHoras)}). ` +
        `Primero debes reprogramarla a otro día o reducir sus horas.`,
    )
    return true
  }

  /* ---- borrador local (cero peticiones hasta "Guardar") -------------- */

  // La gestión tal como se ve: datos guardados + cambios del borrador
  const vista = (g) => ({ ...g, ...borradores[g.id] })

  function editarBorrador(gid, cambios) {
    setBorradores((prev) => ({ ...prev, [gid]: { ...prev[gid], ...cambios } }))
  }

  function descartar(gid) {
    setBorradores((prev) => {
      const copia = { ...prev }
      delete copia[gid]
      return copia
    })
  }

  // Check, Posponer y Reabrir ahora SOLO tocan el borrador
  function alternar(gestion, marcado) {
    if (!marcado && sinEspacio(gestion)) return
    editarBorrador(gestion.id, { estado: marcado ? 'hecho' : 'pendiente' })
  }

  function posponer(gestion) {
    editarBorrador(gestion.id, { estado: 'pospuesto' })
  }

  function reabrir(gestion) {
    if (sinEspacio(gestion)) return
    editarBorrador(gestion.id, { estado: 'pendiente' })
  }

  // Una sola petición con todo lo que cambió
  async function guardar(gestion) {
    const borrador = borradores[gestion.id]
    if (!borrador) return

    // Solo se manda lo que realmente difiere de lo guardado
    const cambios = Object.fromEntries(
      Object.entries(borrador).filter(([campo, valor]) => valor !== (gestion[campo] ?? '')),
    )
    if (Object.keys(cambios).length === 0) return descartar(gestion.id)

    setGuardando(gestion.id)
    try {
      await guardarGestion(gestion.id, cambios)
      descartar(gestion.id)
      avisar(
        cambios.estado === 'hecho' ? `Listo: «${gestion.nombre}» quedó como hecha`
        : cambios.estado === 'pospuesto' ? `Pospusiste «${gestion.nombre}»`
        : cambios.estado === 'pendiente' ? `«${gestion.nombre}» volvió a pendiente`
        : 'Nota guardada',
      )
    } catch {
      avisar('No se pudo guardar la gestión. Intenta de nuevo.')
    } finally {
      setGuardando(null)
    }
  }

  /* ---- eliminar ------------------------------------------------------- */

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
      descartar(eliminandoGestion.id)
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
        <div className="detalle__acciones">
          <Link to={`/evento/${evento.id}/editar`} className="btn btn--fantasma btn--sm">
            Editar evento
          </Link>
          <button
            type="button"
            className="btn btn--peligro btn--sm"
            onClick={() => setEliminandoEvento(true)}
          >
            Eliminar evento
          </button>
        </div>
      </div>

      <p className="detalle__meta">
        <span>{fechaLarga(evento.fecha)}</span>
        <i className="evento__punto" />
        <span>
          <span className="num">{hechas}</span> de <span className="num">{evento.gestiones.length}</span> gestiones listas
          {' · '}
          <span className="num">{pct}%</span>
        </span>
      </p>

      <div className="progreso__barra" role="img" aria-label={`Preparación del evento al ${pct} por ciento`}>
        {segmentos.map((g) => (
          <span key={g.id} className={`segmento ${claseSegmento(g)}`} />
        ))}
      </div>

      {dias.map((dia) => {
        const delDia = evento.gestiones
          .filter((g) => g.fecha === dia)
          .sort((a, b) => a.hora.localeCompare(b.hora))
        const horasDia = delDia
          .filter((g) => g.estado !== 'hecho' && g.estado !== 'pospuesto')
          .reduce((s, g) => s + Number(g.horas || 0), 0)

        return (
          <section key={dia}>
            <h2 className="grupo__titulo detalle__dia">
              {mayuscula(nombreDia(dia))}
              <span className="grupo__conteo">{formatoHoras(horasDia)}</span>
            </h2>

            <ul className="plan">
              {delDia.map((g) => {
                const v = vista(g) // lo que se pinta (guardado + borrador)
                const hecho = v.estado === 'hecho'
                const vencida = clasificar(v) === 'vencido'
                const pendienteGuardar = Boolean(borradores[g.id])
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
                      {v.estado === 'pospuesto' && (
                        <span className="etiqueta etiqueta--pospuesto">Pospuesta</span>
                      )}
                    </div>

                    <div className="gestion__acciones">
                      {!hecho &&
                        (v.estado === 'pospuesto' ? (
                          <button
                            type="button"
                            className="btn btn--fantasma btn--sm"
                            onClick={() => reabrir(g)}
                            aria-label={`Reabrir ${g.nombre}`}
                          >
                            Reabrir
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--fantasma btn--sm"
                            onClick={() => posponer(g)}
                            aria-label={`Posponer ${g.nombre}`}
                          >
                            Posponer
                          </button>
                        ))}
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

                    {(hecho || v.estado === 'pospuesto') && (
                      <input
                        className="gestion__nota"
                        value={v.nota ?? ''} // controlado: lee del borrador o de lo guardado
                        onChange={(e) => editarBorrador(g.id, { nota: e.target.value })}
                        placeholder={
                          hecho
                            ? 'Nota (opcional): ¿quedó algo pendiente?'
                            : 'Nota (opcional): ¿por qué la pospones?'
                        }
                        aria-label={`Nota de ${g.nombre}`}
                      />
                    )}

                    {pendienteGuardar && (
                      <div className="gestion__guardar">
                        <button
                          type="button"
                          className="btn btn--fantasma btn--sm"
                          onClick={() => descartar(g.id)}
                          disabled={guardando === g.id}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() => guardar(g)}
                          disabled={guardando === g.id}
                        >
                          {guardando === g.id ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <DialogoReprogramar
        key={reprogramando?.id ?? 'cerrado'}
        gestion={reprogramando}
        onCerrar={() => setReprogramando(null)}
      />
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