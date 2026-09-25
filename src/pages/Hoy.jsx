import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEventos } from '../context/EventosContext.jsx'
import { fechaLarga, formatoHoras, hoyISO } from '../lib/fechas.js'
import { clasificar, cuantoFalta, ETIQUETA, PRIORIDAD } from '../lib/prioridad.js'
import './hoy.css'

// T2: la vista "Hoy" separa lo que exige acción de lo que puede esperar.
export default function Hoy() {
  const { estadoCarga, cargar, gestionesDelDia, horasDelDia, limiteHoras } = useEventos()

  // TODO (evidencia Sprint 0): este conmutador es solo para capturar los cuatro
  // estados de pantalla. Cuando la API sea real, basta con estadoCarga.
  const [demo, setDemo] = useState('auto')

  const hoy = hoyISO()
  const gestiones = gestionesDelDia(hoy).map((g) => ({ ...g, clase: clasificar(g) }))
  const pendientes = gestiones.filter((g) => g.estado !== 'hecho')

  const estado =
    demo !== 'auto' ? demo
    : estadoCarga !== 'exito' ? estadoCarga
    : gestiones.length === 0 ? 'vacio'
    : 'exito'

  const total = horasDelDia(hoy)
  const escala = Math.max(total, limiteHoras) || 1
  const excedida = total > limiteHoras

  const atencion = gestiones.filter((g) => g.clase === 'vencido' || g.clase === 'urgente')
  const luego = gestiones.filter((g) => g.clase === 'proximo' || g.clase === 'pospuesto')
  const hechas = gestiones.filter((g) => g.clase === 'hecho')

  return (
    <div className="hoy vista">
      <div className="hoy__header">
        <div>
          <h1 className="hoy__title">Tu día</h1>
          <p className="hoy__sub">
            {estado === 'exito'
              ? `${pendientes.length} gestiones pendientes de ${gestiones.length}`
              : fechaLarga(hoy)}
          </p>
        </div>
        <Link to="/crear" className="btn btn--accion">Crear evento</Link>
      </div>

      {estado === 'cargando' && (
        <>
          <p className="sr-only">Cargando las gestiones de hoy</p>
          <div className="lista-eventos lista-eventos--cargando" aria-hidden="true">
            {[80, 60, 70].map((w) => (
              <div className="skeleton-fila" key={w}>
                <span className="skeleton" />
                <span className="skeleton" style={{ '--w': `${w}%` }} />
              </div>
            ))}
          </div>
        </>
      )}

      {estado === 'error' && (
        <section className="state state--error">
          <h2 className="state__titulo">No pudimos cargar tu día</h2>
          <p className="state__texto">
            La conexión con el servidor falló. Revisa tu internet y vuelve a intentarlo.
          </p>
          <button type="button" className="btn btn--fantasma" onClick={() => { setDemo('auto'); cargar() }}>
            Reintentar
          </button>
        </section>
      )}

      {estado === 'vacio' && (
        <section className="state state--vacio">
          <h2 className="state__titulo">Tu día está libre</h2>
          <p className="state__texto">
            Todavía no hay gestiones para hoy. Crea un evento con su plan de trabajo y aparecerán aquí.
          </p>
          <Link to="/crear" className="btn">Crear evento</Link>
        </section>
      )}

      {estado === 'exito' && (
        <>
          <div className={'carga' + (excedida ? ' carga--excedida' : '')}>
            <div className="carga__datos">
              <span>Carga del día</span>
              <span className="carga__horas">
                {formatoHoras(total)} de {formatoHoras(limiteHoras)}
              </span>
            </div>
            <div
              className="carga__barra"
              role="img"
              aria-label={`Llevas ${formatoHoras(total)} planeadas de un límite de ${formatoHoras(limiteHoras)}`}
            >
              <div className="carga__relleno" style={{ '--pct': `${Math.min(100, (total / escala) * 100)}%` }} />
              <span className="carga__limite" style={{ '--limite': `${(limiteHoras / escala) * 100}%` }} />
            </div>
            {excedida && (
              <p className="campo__error">
                Hoy supera tu límite por {formatoHoras(total - limiteHoras)}. Reprograma una gestión para equilibrarlo.
              </p>
            )}
          </div>

          <Grupo titulo="Requiere atención ahora" items={atencion} destacado />
          <Grupo titulo="Más tarde hoy" items={luego} />
          <Grupo titulo="Completadas" items={hechas} />

          <p className="hoy__pie">
            Ordenamos por hora. Se marca <strong>vencida</strong> si ya pasó su hora y{' '}
            <strong>urgente</strong> si faltan 90 minutos o menos.
          </p>
        </>
      )}

      <p className="hoy__pie">
        Estados de la pantalla (demo):{' '}
        {[
          ['auto', 'con datos'],
          ['vacio', 'vacío'],
          ['cargando', 'cargando'],
          ['error', 'error'],
        ].map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            className="btn--texto"
            aria-current={demo === clave ? 'true' : undefined}
            onClick={() => setDemo(clave)}
          >
            {texto}
          </button>
        ))}
      </p>
    </div>
  )
}

function Grupo({ titulo, items, destacado = false }) {
  if (items.length === 0) return null
  const ordenadas = [...items].sort((a, b) => PRIORIDAD[a.clase] - PRIORIDAD[b.clase])

  return (
    <section className={'grupo' + (destacado ? ' grupo--urgente' : '')}>
      <h2 className="grupo__titulo">
        {titulo}
        <span className="grupo__conteo">{items.length}</span>
      </h2>
      <ul className="lista-eventos">
        {ordenadas.map((g) => (
          <li key={g.id}>
            <Link to={`/evento/${g.evento.id}`} className={`evento evento--${g.clase}`}>
              <span className="evento__hora">{g.hora.slice(0, 5)}</span>
              <span className="evento__meta">
                {g.evento.nombre}
                <i className="evento__punto" />
                <span className="num">{formatoHoras(g.horas)}</span>
              </span>
              <span className={`etiqueta etiqueta--${g.clase}`}>
                {g.clase === 'urgente' ? cuantoFalta(g) : ETIQUETA[g.clase]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
