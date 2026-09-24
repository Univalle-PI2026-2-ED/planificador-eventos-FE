import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventos } from '../context/EventosContext.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { formatoHoras, hoyISO, mayuscula, nombreDia, sumarDias } from '../lib/fechas.js'
import './crear.css'

const gestionVacia = (k) => ({ k, nombre: '', fecha: hoyISO(), hora: '09:00', horas: 1 })

// T1: crear el evento y su plan de trabajo logístico con plazos y horas.
export default function Crear() {
  const navigate = useNavigate()
  const { agregarEvento, nombreDuplicado, limiteHoras, setLimiteHoras } = useEventos()
  const { avisar } = useAvisos()
  const refNombre = useRef(null)
  const refsNombreGestion = useRef({})
  const refAgregar = useRef(null)
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 7))
  const [limite, setLimite] = useState(limiteHoras)
  const [plan, setPlan] = useState([])
  const [siguienteK, setSiguienteK] = useState(1)
  const [errores, setErrores] = useState({})

  const actualizar = (k, campo, valor) =>
    setPlan((prev) => prev.map((g) => (g.k === k ? { ...g, [campo]: valor } : g)))

  const quitar = (k) => {
    setPlan((prev) => prev.filter((g) => g.k !== k))
    requestAnimationFrame(() => refAgregar.current?.focus())
  }

  function agregarGestion() {
    const k = siguienteK
    setPlan((prev) => [...prev, gestionVacia(k)])
    setSiguienteK((n) => n + 1)
    requestAnimationFrame(() => refsNombreGestion.current[k]?.focus())
  }

  const totalHoras = plan.reduce((s, g) => s + (Number(g.horas) || 0), 0)

  // Aviso temprano del conflicto de T3: días del plan que ya nacen sobrecargados.
  const porDia = plan.reduce((acc, g) => {
    acc[g.fecha] = (acc[g.fecha] || 0) + (Number(g.horas) || 0)
    return acc
  }, {})
  const sobrecargados = Object.entries(porDia).filter(([, h]) => h > Number(limite))

  function cambiarLimite(valor) {
    setLimite(valor)
    const n = Number(valor)
    if (n > 0) setLimiteHoras(n)
  }

  function validarNombreEnTiempoReal(texto) {
    if (!texto.trim()) {
      return 'Escribe un nombre para reconocer el evento.'
    }
    if (nombreDuplicado(texto)) {
      return 'Ya existe un evento con ese nombre. Usa uno distinto para diferenciarlos.'
    }
    return '' // Sin errores
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nuevos = {}
    if (!nombre.trim()) nuevos.nombre = 'Escribe un nombre para reconocer el evento.'
    else if (nombreDuplicado(nombre)) {
      nuevos.nombre = 'Ya existe un evento con ese nombre. Usa uno distinto para diferenciarlos.'
    }
    if (plan.length === 0) nuevos.plan = 'Añade al menos una gestión al plan.'
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

    try {
      const evento = await agregarEvento({ nombre, fecha, gestiones: plan })
      avisar('Evento creado')
      navigate(`/evento/${evento.id}`)
    } catch (err) {
      if (err.detalle?.nombre) {
        setErrores({ nombre: err.detalle.nombre[0] })
        refNombre.current?.focus()
      } else {
        avisar('No se pudo crear el evento. Intenta de nuevo.')
      }
    }
  }

  return (
    <div className="crear vista">
      <h1 className="crear__title">Nuevo evento</h1>
      <p className="crear__intro">
        Define el evento y su plan de trabajo. Cada gestión necesita un plazo y las horas que
        crees que te tomará.
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
                  if (['-', '+', 'e', 'E'].includes(e.key)) {
                    e.preventDefault()
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value
                  if (val > 0) {
                    cambiarLimite(val)
                  } else {
                    cambiarLimite('') // Deja el campo vacío si borra o pone <= 0
                  }
                }}
              />
            </div>
          </div>
          {(limite === '' || Number(limite) <= 0) ? (
            <p className="campo__error" id="err-limite">
              * Ingresa un límite de horas diario válido (por ejemplo: 8 o 8.5 horas).
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
            De cada gestión: qué es, qué día y a qué hora la harás, y cuántas horas te tomará.
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
                      if (['-', '+', 'e', 'E'].includes(e.key)) {
                        e.preventDefault()
                      }
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

          <button type="button" className="btn btn--fantasma btn--sm" ref={refAgregar} onClick={agregarGestion}>
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
                . Puedes guardarlo igual: te avisaremos en “Hoy” y podrás reprogramar lo que sobra.
              </p>
            </div>
          )}
        </section>

        <div className="crear__acciones">
          <button type="submit" className="btn btn--full">Guardar evento</button>
          <button type="button" className="btn--texto" onClick={() => navigate('/hoy')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}