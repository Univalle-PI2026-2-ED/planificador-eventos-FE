import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEventos } from '../context/contextos.js'
import { fechaLarga, formatoHoras, hoyISO, mayuscula, nombreDia } from '../lib/fechas.js'
import { clasificar, cuantoFalta, esAtrasada, ETIQUETA, PRIORIDAD, UMBRAL_URGENTE_MIN } from '../lib/prioridad.js'
import { useReloj } from '../lib/useReloj.js'
import './hoy.css'

// Filtros básicos (US-05): todo ocurre en el cliente, sobre las gestiones de hoy.
const FILTROS_ESTADO = [
  { clave: 'todas', texto: 'Todas' },
  { clave: 'atencion', texto: 'Urgentes y vencidas' },
  { clave: 'pendientes', texto: 'Pendientes' },
  { clave: 'hechas', texto: 'Hechas' },
]

function coincideEstado(gestion, filtro) {
  if (filtro === 'atencion') return gestion.clase === 'vencido' || gestion.clase === 'urgente'
  if (filtro === 'pendientes') return gestion.estado !== 'hecho'
  if (filtro === 'hechas') return gestion.estado === 'hecho'
  return true
}

const plural = (n) => `${n} ${n === 1 ? 'gestión' : 'gestiones'}`

// T2: la vista "Hoy" separa lo que exige acción de lo que puede esperar.
export default function Hoy() {
  const { estadoCarga, cargar, gestiones: todas, gestionesDelDia, horasDelDia, limiteHoras } = useEventos() 
  useReloj()

  // TODO (evidencia Sprint 0): este conmutador es solo para capturar los cuatro
  // estados de pantalla. Cuando la API sea real, basta con estadoCarga.
  const [demo, setDemo] = useState('auto')

  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroEvento, setFiltroEvento] = useState('todos')
  const refTodas = useRef(null)

  const hoy = hoyISO()
    // Lo vencido de días anteriores que sigue pendiente no puede desaparecer de
  // "Hoy" solo porque cambió el día: es justo lo que más atención requiere.
  const atrasadas = todas
    .filter((g) => esAtrasada(g, hoy))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
  const gestiones = [...atrasadas, ...gestionesDelDia(hoy)].map((g) => ({
    ...g,
    clase: clasificar(g),
    atrasada: g.fecha < hoy,
  }))
  const pendientes = gestiones.filter((g) => g.estado !== 'hecho')

  const estado =
    demo !== 'auto' ? demo
    : estadoCarga !== 'exito' ? estadoCarga
    : gestiones.length === 0 ? 'vacio'
    : 'exito'

  const total = horasDelDia(hoy)
  const escala = Math.max(total, limiteHoras) || 1
  const excedida = total > limiteHoras

  // Los filtros solo afectan a las listas: la carga del día de arriba sigue
  // contando todas las gestiones de hoy, porque el límite es del día completo.
  const eventosDeHoy = [...new Map(gestiones.map((g) => [String(g.evento.id), g.evento.nombre]))]
    .sort((a, b) => a[1].localeCompare(b[1]))
  const eventoActivo = eventosDeHoy.some(([id]) => id === filtroEvento) ? filtroEvento : 'todos'
  const hayFiltros = filtroEstado !== 'todas' || eventoActivo !== 'todos'
  const visibles = gestiones.filter(
    (g) =>
      coincideEstado(g, filtroEstado) &&
      (eventoActivo === 'todos' || String(g.evento.id) === eventoActivo),
  )

  const atencion = visibles.filter((g) => g.clase === 'vencido' || g.clase === 'urgente')
  const luego = visibles.filter((g) => g.clase === 'proximo' || g.clase === 'pospuesto')
  const hechas = visibles.filter((g) => g.clase === 'hecho')

  function quitarFiltros() {
    setFiltroEstado('todas')
    setFiltroEvento('todos')
    // El botón "Quitar filtros" desaparece al usarse: el foco vuelve a "Todas".
    requestAnimationFrame(() => refTodas.current?.focus())
  }

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

          <div className="filtros" role="group" aria-label="Filtrar las gestiones de hoy">
            <div className="filtros__estado">
              {FILTROS_ESTADO.map((f) => (
                <button
                  key={f.clave}
                  type="button"
                  className="filtro"
                  ref={f.clave === 'todas' ? refTodas : undefined}
                  aria-pressed={filtroEstado === f.clave}
                  onClick={() => setFiltroEstado(f.clave)}
                >
                  {f.texto}
                </button>
              ))}
            </div>

            {eventosDeHoy.length > 1 && (
              <div className="filtros__evento">
                <label className="sr-only" htmlFor="filtro-evento">Filtrar por evento</label>
                <select
                  id="filtro-evento"
                  value={eventoActivo}
                  onChange={(e) => setFiltroEvento(e.target.value)}
                >
                  <option value="todos">Todos los eventos</option>
                  {eventosDeHoy.map(([id, nombre]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="filtros__resumen" role="status">
            {hayFiltros
              ? `Mostrando ${visibles.length} de ${plural(gestiones.length)}`
              : plural(gestiones.length)}
            {hayFiltros && (
              <button type="button" className="btn--texto" onClick={quitarFiltros}>
                Quitar filtros
              </button>
            )}
          </p>

          {hayFiltros && visibles.length === 0 && (
            <section className="state state--vacio">
              <h2 className="state__titulo">Ninguna gestión coincide</h2>
              <p className="state__texto">
                Prueba con otro filtro o quítalos para ver todo tu día.
              </p>
              <button type="button" className="btn btn--fantasma" onClick={quitarFiltros}>
                Quitar filtros
              </button>
            </section>
          )}

          <Grupo titulo="Requiere atención ahora" items={atencion} destacado />
          <Grupo titulo="Más tarde hoy" items={luego} />
          <Grupo titulo="Completadas" items={hechas} />

          <details className="reglas">
            <summary>¿Cómo decidimos qué es urgente?</summary>
            <ul>
              <li><strong>Vencida:</strong> ya pasó su hora, o es de un día anterior y sigue pendiente.</li>
              <li><strong>Urgente:</strong> faltan {UMBRAL_URGENTE_MIN} minutos o menos.</li>
              <li><strong>Próxima:</strong> es de hoy y falta más tiempo; va en “Más tarde hoy”.</li>
              <li>Las pospuestas van en “Más tarde hoy” y las hechas en “Completadas”; ninguna cuenta como urgente.</li>
              <li>En cada grupo va primero lo vencido, luego lo urgente y, a igual prioridad, por fecha y hora.</li>
            </ul>
            <p>La lista se actualiza sola cada minuto.</p>
          </details>
        </>
      )}
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
              <span className="evento__titulo">{g.nombre}</span>
              <span className="evento__meta">
                {g.atrasada && (
                  <>
                    <strong className="evento__atraso">{mayuscula(nombreDia(g.fecha))}</strong>
                    <i className="evento__punto" />
                  </>
                )}
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
