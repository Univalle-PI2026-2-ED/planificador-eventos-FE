import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEventos, useAvisos } from '../context/contextos.js'
import { formatoHoras, hoyISO, mayuscula, nombreDia } from '../lib/fechas.js'
import DialogoReprogramar from '../components/DialogoReprogramar.jsx'
import './crear.css'
import './evento.css'

// Compara los datos editados de una gestión contra los originales y
// devuelve solo los campos que de verdad cambiaron (para no mandar PATCH
// de campos sin tocar).
function diferencia(original, editado) {
  const cambios = {}
  if (editado.nombre.trim() !== original.nombre) cambios.nombre = editado.nombre.trim()
  if (editado.fecha !== original.fecha) cambios.fecha = editado.fecha
  if (editado.hora !== original.hora.slice(0, 5)) cambios.hora = editado.hora
  if (Number(editado.horas) !== Number(original.horas)) cambios.horas = Number(editado.horas)
  return cambios
}

// Fila nueva del plan: sin "id" todavía (se crea en la API recién al
// guardar), con una "k" de React única que no choca con ids reales.
const gestionNueva = (k) => ({ k, id: null, nombre: '', fecha: hoyISO(), hora: '09:00', horas: 1 })

// T-edición: corregir un evento ya creado (nombre, fecha, o su plan de
// trabajo) sin tener que eliminarlo y volver a crearlo desde cero.
// Las gestiones existentes se editan/borran como antes; las gestiones
// nuevas que se agreguen aquí se crean con POST /eventos/<id>/subtareas/
// al guardar.
export default function EditarEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    obtenerEvento,
    editarEvento,
    editarGestion,
    agregarGestion,
    eliminarGestion,
    nombreDuplicado,
    limiteHoras,
    gestiones,
  } = useEventos()
  const { avisar } = useAvisos()
  const refNombre = useRef(null)
  const refsNombreGestion = useRef({})
  const refAgregar = useRef(null)
  const evento = obtenerEvento(id)

  const [nombre, setNombre] = useState(evento?.nombre ?? '')
  const [fecha, setFecha] = useState(evento?.fecha ?? '')
  const [plan, setPlan] = useState(() =>
    (evento?.gestiones ?? []).map((g) => ({
      k: g.id,
      id: g.id,
      nombre: g.nombre,
      fecha: g.fecha,
      hora: g.hora.slice(0, 5),
      horas: g.horas,
      estado: g.estado,
    })),
  )
  const [siguienteNuevaK, setSiguienteNuevaK] = useState(1)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [reprogramando, setReprogramando] = useState(null)

  if (!evento) {
    return (
      <div className="crear vista">
        <Link to="/hoy" className="btn--texto">← Volver a hoy</Link>
        <section className="state state--vacio">
          <h2 className="state__titulo">No encontramos ese evento</h2>
          <p className="state__texto">Puede que lo hayas eliminado o que el enlace esté incompleto.</p>
          <Link to="/hoy" className="btn">Ir a tu día</Link>
        </section>
      </div>
    )
  }

  const actualizar = (k, campo, valor) =>
    setPlan((prev) => prev.map((g) => (g.k === k ? { ...g, [campo]: valor } : g)))

  const quitar = (k) => {
    setPlan((prev) => prev.filter((g) => g.k !== k))
    requestAnimationFrame(() => refAgregar.current?.focus())
  }

  function agregarFilaGestion() {
    const k = `nueva-${siguienteNuevaK}`
    setPlan((prev) => [...prev, gestionNueva(k)])
    setSiguienteNuevaK((n) => n + 1)
    requestAnimationFrame(() => refsNombreGestion.current[k]?.focus())
  }

  const totalHoras = plan.reduce((s, g) => s + (Number(g.horas) || 0), 0)

  const porDia = plan.reduce((acc, g) => {
    acc[g.fecha] = (acc[g.fecha] || 0) + (Number(g.horas) || 0)
    return acc
  }, {})
  const sobrecargados = Object.entries(porDia).filter(([, h]) => h > Number(limiteHoras))

  function buscarConflicto() {
    const limite = Number(limiteHoras)
    const idsDelEvento = new Set(evento.gestiones.map((g) => g.id))

    for (const g of plan) {
      if (g.id == null) continue
      const original = evento.gestiones.find((og) => og.id === g.id)
      if (!original || original.estado === 'hecho') continue

      const cambio =
        Number(g.horas) !== Number(original.horas) || g.fecha !== original.fecha
      if (!cambio) continue

      const deOtrosEventos = gestiones
        .filter((x) => x.fecha === g.fecha && x.estado !== 'hecho' && !idsDelEvento.has(x.id))
        .reduce((s, x) => s + Number(x.horas || 0), 0)

      const deEsteEvento = plan
        .filter((p) => p.fecha === g.fecha && p.estado !== 'hecho')
        .reduce((s, p) => s + (Number(p.horas) || 0), 0)

      if (deOtrosEventos + deEsteEvento > limite) return g
    }
    return null
  }

  function validarNombreEnTiempoReal(texto) {
    if (!texto.trim()) return 'Escribe un nombre para reconocer el evento.'
    if (nombreDuplicado(texto, evento.id)) {
      return 'Ya existe un evento con ese nombre. Usa uno distinto para diferenciarlos.'
    }
    return ''
  }

  function buscarConflicto() {
    const limite = Number(limiteHoras)
    const idsDelEvento = new Set(evento.gestiones.map((g) => g.id))

    for (const g of plan) {
      if (g.id == null) continue
      const original = evento.gestiones.find((og) => og.id === g.id)
      if (!original || original.estado === 'hecho') continue

      const cambio =
        Number(g.horas) !== Number(original.horas) || g.fecha !== original.fecha
      if (!cambio) continue

      const deOtrosEventos = gestiones
        .filter((x) => x.fecha === g.fecha && x.estado !== 'hecho' && !idsDelEvento.has(x.id))
        .reduce((s, x) => s + Number(x.horas || 0), 0)

      const deEsteEvento = plan
        .filter((p) => p.fecha === g.fecha && p.estado !== 'hecho')
        .reduce((s, p) => s + (Number(p.horas) || 0), 0)

      if (deOtrosEventos + deEsteEvento > limite) return g
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const nuevos = {}
    if (!nombre.trim()) nuevos.nombre = 'Escribe un nombre para reconocer el evento.'
    else if (nombreDuplicado(nombre, evento.id)) {
      nuevos.nombre = 'Ya existe un evento con ese nombre. Usa uno distinto para diferenciarlos.'
    }

    if (!fecha) nuevos.fecha = 'Elige la fecha del evento.' 

    if (plan.length === 0) nuevos.plan = 'El evento necesita al menos una gestión en su plan.'
    else if (plan.some((g) => !g.nombre.trim() || !g.hora || !g.fecha)) {
      nuevos.plan = 'Cada gestión necesita un nombre, un día y una hora.'
    } else if (plan.some((g) => Number(g.horas) <= 0 || isNaN(Number(g.horas)))) {
      nuevos.plan = 'El tiempo estimado debe ser un número mayor a 0.'
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      if (nuevos.nombre) refNombre.current?.focus()
      return
    }

    const conflicto = buscarConflicto()
    if (conflicto) {
      const original = evento.gestiones.find((og) => og.id === conflicto.id)
      setReprogramando({ ...original, fecha: conflicto.fecha, horas: Number(conflicto.horas) })
      return
    }

    setGuardando(true)
    try {
      const cambiosEvento = {}
      if (nombre.trim() !== evento.nombre) cambiosEvento.nombre = nombre.trim()
      if (fecha !== evento.fecha) cambiosEvento.fecha = fecha

      const existentes = plan.filter((g) => g.id != null)
      const nuevas = plan.filter((g) => g.id == null)

      const idsActuales = new Set(existentes.map((g) => g.id))
      const eliminadas = evento.gestiones.filter((g) => !idsActuales.has(g.id))

      await Promise.all([
        Object.keys(cambiosEvento).length > 0
          ? editarEvento(evento.id, cambiosEvento)
          : null,

        ...existentes.map((g) => {
          const original = evento.gestiones.find((og) => og.id === g.id)
          const cambios = diferencia(original, g)

          return Object.keys(cambios).length > 0
            ? editarGestion(g.id, cambios)
            : null
        }),

        ...nuevas.map((g) => agregarGestion(evento.id, g)),

        ...eliminadas.map((g) => eliminarGestion(g.id)),
      ])

      avisar('Cambios guardados')
      navigate(`/evento/${evento.id}`)
    } catch (err) {
      if (err.detalle?.nombre) {
        setErrores({ nombre: err.detalle.nombre[0] })
        refNombre.current?.focus()
      } else {
        avisar('No se pudieron guardar los cambios. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="crear vista">
      <Link to={`/evento/${evento.id}`} className="btn--texto">← Volver al evento</Link>
      <h1 className="crear__title">Editar evento</h1>
      <p className="crear__intro">
        Corrige el nombre, la fecha o el plan de trabajo. Los cambios se guardan cuando
        presionas “Guardar cambios”.
      </p>

      <form className="crear__form" onSubmit={handleSubmit} noValidate>
        <section className="bloque">
          <h2 className="bloque__titulo">El evento</h2>

          <div className={'campo' + (errores.nombre ? ' campo--error' : '')}>
            <label className="campo__label" htmlFor="f-nombre">Nombre del evento</label>
            <input
              id="f-nombre"
              ref={refNombre}
              value={nombre}
              onChange={(e) => {
                const nuevoTexto = e.target.value
                setNombre(nuevoTexto)
                const error = validarNombreEnTiempoReal(nuevoTexto)
                setErrores((prev) => ({ ...prev, nombre: error }))
              }}
              placeholder="Ej. Boda de Ana y Luis"
              aria-invalid={errores.nombre ? 'true' : undefined}
              aria-describedby={errores.nombre ? 'err-nombre' : undefined}
            />
            {errores.nombre && <p className="campo__error" id="err-nombre">{errores.nombre}</p>}
          </div>

          <div className="fila-campos">
            <div className="campo">
              <label className="campo__label" htmlFor="f-fecha">Fecha del evento</label>
              <input id="f-fecha" type="date" value={fecha} aria-invalid={errores.fecha ? 'true' : undefined} onChange={(e) => setFecha(e.target.value)} />
              {errores.fecha && <p className="campo__error">{errores.fecha}</p>}
            </div>
            
          </div>
          
        </section>

        <section className="bloque">
          <h2 className="bloque__titulo">
            Plan de trabajo
            <span className="bloque__nota">{plan.length} gestiones</span>
          </h2>

          <p className="campo__ayuda">
            Corrige el nombre, el día, la hora o las horas estimadas de cada gestión, o añade
            gestiones nuevas al plan. Si quitas una, se elimina (o se descarta, si aún no se
            había guardado) al guardar.
          </p>

          <ul className="subtareas">
            {plan.map((g, i) => (
              <li className="subtarea" key={g.k}>
                <input
                  className="subtarea__nombre"
                  ref={(el) => (refsNombreGestion.current[g.k] = el)}
                  aria-label={`Nombre de la gestión ${i + 1}`}
                  value={g.nombre}
                  onChange={(e) => actualizar(g.k, 'nombre', e.target.value)}
                  placeholder="Ej. Confirmar catering"
                />
                <button
                  type="button"
                  className="subtarea__quitar"
                  onClick={() => quitar(g.k)}
                  aria-label={`Quitar ${g.nombre || `gestión ${i + 1}`}`}
                >
                  ×
                </button>
                <div className="subtarea__datos">
                  <input
                    type="date"
                    aria-label={`Día de la gestión ${i + 1}`}
                    value={g.fecha}
                    onChange={(e) => actualizar(g.k, 'fecha', e.target.value)}
                  />
                  <input
                    type="time"
                    aria-label={`Hora de la gestión ${i + 1}`}
                    value={g.hora}
                    onChange={(e) => actualizar(g.k, 'hora', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    aria-label={`Horas estimadas de la gestión ${i + 1}`}
                    aria-invalid={(g.horas === '' || Number(g.horas) <= 0) ? 'true' : undefined}
                    aria-describedby={(g.horas === '' || Number(g.horas) <= 0) ? `err-horas-${g.k}` : undefined}
                    value={g.horas}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault()
                    }}
                    onChange={(e) => actualizar(g.k, 'horas', e.target.value > 0 ? e.target.value : '')}
                  />
                </div>
                {(g.horas === '' || Number(g.horas) <= 0) && (
                  <p className="subtarea__error-texto" id={`err-horas-${g.k}`}>
                    * El tiempo estimado debe ser mayor a 0 horas.
                  </p>
                )}
              </li>
            ))}
          </ul>

          {errores.plan && <p className="campo__error">{errores.plan}</p>}

          <button
            type="button"
            className="btn btn--fantasma btn--sm"
            ref={refAgregar}
            onClick={agregarFilaGestion}
          >
            Añadir gestión
          </button>

          <div className={'total' + (sobrecargados.length > 0 ? ' total--excedido' : '')}>
            <span>Total estimado del plan</span>
            <span className="total__cifra">{formatoHoras(totalHoras)}</span>
          </div>

          {sobrecargados.length > 0 && (
            <div className="aviso">
              <span className="aviso__titulo">Hay días que superan tu límite</span>
              <p className="aviso__texto">
                {sobrecargados
                  .map(([dia, h]) => `${mayuscula(nombreDia(dia))} acumula ${formatoHoras(h)}`)
                  .join('. ')}
                . Al guardar te ayudaremos a reprogramar lo que sobra.
              </p>
            </div>
          )}
        </section>

        <div className="crear__acciones">
          <button type="submit" className="btn btn--full" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" className="btn--texto" onClick={() => navigate(`/evento/${evento.id}`)}>
            Cancelar
          </button>
        </div>
      </form>
      <DialogoReprogramar
        key={reprogramando?.id ?? 'cerrado'}
        gestion={reprogramando}
        onCerrar={() => setReprogramando(null)}
        onReprogramada={(r) => {
          setPlan((prev) =>
            prev.map((g) => (g.id === r.id ? { ...g, fecha: r.fecha, horas: r.horas } : g)),
          )
          avisar('Gestión reprogramada. Guarda para aplicar el resto de los cambios.')
        }}
      />
    </div>
  )
}