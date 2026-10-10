import { Link } from 'react-router-dom'
import { useEventos } from '../context/contextos.js'
import { fechaLarga, formatoHoras } from '../lib/fechas.js'
import { clasificar } from '../lib/prioridad.js'
import './progreso.css'

const claseSegmento = (g) => {
  if (g.estado === 'hecho') return 'segmento--hecho'
  if (g.estado === 'pospuesto') return 'segmento--pospuesto'
  return clasificar(g) === 'vencido' ? 'segmento--vencido' : ''
}

// T4: registro de lo ejecutado y barra de preparación por evento.
export default function Progreso() {
  const { eventos, bitacora, estadoCarga, cargar } = useEventos()

  return (
    <div className="progreso vista">
      <h1 className="progreso__title">Progreso</h1>
      <p className="progreso__intro">
        Un tramo por gestión. Verde es hecha, rojo es vencida y rayado es pospuesta.
      </p>

      {estadoCarga === 'cargando' && (
        <p className="state__texto" role="status">Cargando tu progreso…</p>
      )}

      {estadoCarga === 'error' && (
        <section className="state state--error">
          <h2 className="state__titulo">No pudimos cargar tu progreso</h2>
          <p className="state__texto">
            La conexión con el servidor falló. Revisa tu internet y vuelve a intentarlo.
          </p>
          <button type="button" className="btn btn--fantasma" onClick={cargar}>
            Reintentar
          </button>
        </section>
      )}
      {estadoCarga === 'exito' && eventos.length === 0 && (
        <section className="state state--vacio">
          <h2 className="state__titulo">Todavía no hay eventos</h2>
          <p className="state__texto">Cuando crees uno, aquí verás cuánto llevas preparado.</p>
          <Link to="/crear" className="btn">Crear evento</Link>
        </section>
      )}

      {estadoCarga === 'exito' && eventos.map((ev) => {
        const hechas = ev.gestiones.filter((g) => g.estado === 'hecho').length
        const pct = ev.gestiones.length ? Math.round((hechas / ev.gestiones.length) * 100) : 0
        const faltan = ev.gestiones
          .filter((g) => g.estado !== 'hecho')
          .reduce((s, g) => s + (Number(g.horas) || 0), 0)


        return (
          <section className="avance" key={ev.id}>
            <div className="avance__header">
              <h2 className="avance__nombre">{ev.nombre}</h2>
              <span className="avance__fecha">{fechaLarga(ev.fecha)}</span>
            </div>

            <div className="avance__cifra">
              <span className="avance__pct">{pct}%</span>
              <span className="avance__detalle">
                {hechas} de {ev.gestiones.length} gestiones · faltan {formatoHoras(faltan)}
              </span>
            </div>

            <div className="progreso__barra" role="img" aria-label={`${pct} por ciento del plan completado`}>
              {ev.gestiones.map((g) => (
                <span key={g.id} className={`segmento ${claseSegmento(g)}`} />
              ))}
            </div>

            <Link className="btn--texto" to={`/evento/${ev.id}`}>Ver plan de trabajo</Link>
          </section>
        )
      })}

      <div className="leyenda">
        <span className="leyenda__item"><i className="leyenda__muestra leyenda__muestra--hecho" />Hecha</span>
        <span className="leyenda__item"><i className="leyenda__muestra leyenda__muestra--vencido" />Vencida</span>
        <span className="leyenda__item"><i className="leyenda__muestra leyenda__muestra--pospuesto" />Pospuesta</span>
        <span className="leyenda__item"><i className="leyenda__muestra" />Pendiente</span>
      </div>

      <section className="bitacora">
        <h2 className="bitacora__titulo">Lo que registraste hoy</h2>
        {bitacora.length === 0 ? (
          <p className="bitacora__vacio">
            Aún no registras nada hoy. Marca una gestión como hecha o pospuesta y aparecerá aquí.
          </p>
        ) : (
          <ul className="bitacora__lista">
            {bitacora.map((h) => (
              <li className="hito" key={h.id}>
                <span className="hito__hora">{h.hora}</span>
                <span className="hito__texto">
                  {h.accion} <strong>{h.destacado}</strong>{h.cola ? ` ${h.cola}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
