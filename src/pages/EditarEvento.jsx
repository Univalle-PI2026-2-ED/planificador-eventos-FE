import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEventos, useAvisos } from '../context/contextos.js'
import { formatoHoras, mayuscula, nombreDia } from '../lib/fechas.js'
import './crear.css'

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

// T-edición: corregir un evento ya creado (nombre, fecha, o su plan de
// trabajo) sin tener que eliminarlo y volver a crearlo desde cero.
// Nota: la API permite editar y borrar gestiones existentes, pero no
// añadir gestiones nuevas a un evento ya creado — por eso aquí no hay
// botón de "Añadir gestión" como en Crear.
export default function EditarEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    obtenerEvento,
    editarEvento,
    editarGestion,
    eliminarGestion,
    nombreDuplicado,
    limiteHoras,
    guardarLimiteHoras,
  } = useEventos()
  const { avisar } = useAvisos()
  const refNombre = useRef(null)
  const evento = obtenerEvento(id)

  const [nombre, setNombre] = useState(evento?.nombre ?? '')
  const [fecha, setFecha] = useState(evento?.fecha ?? '')
  const [limite, setLimite] = useState(limiteHoras)
  const [plan, setPlan] = useState(() =>
    (evento?.gestiones ?? []).map((g) => ({
      k: g.id,
      id: g.id,
      nombre: g.nombre,
      fecha: g.fecha,
      hora: g.hora.slice(0, 5),
      horas: g.horas,
    })),
  )
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

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

  const quitar = (k) => setPlan((prev) => prev.filter((g) => g.k !== k))

  const totalHoras = plan.reduce((s, g) => s + (Number(g.horas) || 0), 0)

  const porDia = plan.reduce((acc, g) => {
    acc[g.fecha] = (acc[g.fecha] || 0) + (Number(g.horas) || 0)
    return acc
  }, {})
  const sobrecargados = Object.entries(porDia).filter(([, h]) => h > Number(limite))

  function cambiarLimite(valor) {
    setLimite(valor)
  }

  function validarNombreEnTiempoReal(texto) {
    if (!texto.trim()) return 'Escribe un nombre para reconocer el evento.'
    if (nombreDuplicado(texto, evento.id)) {
      return 'Ya existe un evento con ese nombre. Usa uno distinto para diferenciarlos.'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const valorLimite = Number(limite)

    if (
      limite === '' ||
      !Number.isFinite(valorLimite) ||
      valorLimite < 1 ||
      valorLimite > 12 ||
      valorLimite * 2 !== Math.round(valorLimite * 2)
    ) {
      setErrores((prev) => ({
        ...prev,
        limite: 'El límite debe estar entre 1 y 12 horas, en pasos de 0.5.',
      }))
      return
    }

    const nuevos = {}
    if (!nombre.trim()) nuevos.nombre = 'Escribe un nombre para reconocer el evento.'
    else if (nombreDuplicado(nombre, evento.id)) {
      nuevos.nombre = 'Ya existe un evento con ese nombre. Usa uno distinto para diferenciarlos.'
    }
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

    setGuardando(true)
    try {
      const cambiosEvento = {}
      if (nombre.trim() !== evento.nombre) cambiosEvento.nombre = nombre.trim()
      if (fecha !== evento.fecha) cambiosEvento.fecha = fecha

      const idsActuales = new Set(plan.map((g) => g.id))
      const eliminadas = evento.gestiones.filter((g) => !idsActuales.has(g.id))

      const limiteCambio = valorLimite !== Number(limiteHoras)

      await Promise.all([
        Object.keys(cambiosEvento).length > 0
          ? editarEvento(evento.id, cambiosEvento)
          : null,

        ...plan.map((g) => {
          const original = evento.gestiones.find((og) => og.id === g.id)
          const cambios = diferencia(original, g)

          return Object.keys(cambios).length > 0
            ? editarGestion(g.id, cambios)
            : null
        }),

        ...eliminadas.map((g) => eliminarGestion(g.id)),

        limiteCambio
          ? guardarLimiteHoras(valorLimite)
          : null,
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
              <input id="f-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="campo">
              <label className="campo__label" htmlFor="f-limite">Límite de horas al día</label>
              <input
                id="f-limite"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={limite}
                aria-invalid={(limite === '' || Number(limite) <= 0) ? 'true' : undefined}
                aria-describedby={(limite === '' || Number(limite) <= 0) ? 'err-limite' : undefined}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault()
                }}
                onChange={(e) => {
                  cambiarLimite(e.target.value)
                  setErrores((prev) => ({ ...prev, limite: '' }))
                }}
              />
            </div>
          </div>
          {errores.limite ? (
            <p className="campo__error" id="err-limite">
              {errores.limite}
            </p>
          ) : (
            <p className="campo__ayuda">
              Usamos el límite para avisarte cuando un día acumule más gestiones de las que puedes atender.
            </p>
          )}
        </section>

        <section className="bloque">
          <h2 className="bloque__titulo">
            Plan de trabajo
            <span className="bloque__nota">{plan.length} gestiones</span>
          </h2>

          <p className="campo__ayuda">
            Corrige el nombre, el día, la hora o las horas estimadas de cada gestión. Si quitas
            una, se elimina al guardar.
          </p>

          <ul className="subtareas">
            {plan.map((g, i) => (
              <li className="subtarea" key={g.k}>
                <input
                  className="subtarea__nombre"
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
                . Puedes guardarlo igual: podrás reprogramar lo que sobra después.
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
    </div>
  )
}