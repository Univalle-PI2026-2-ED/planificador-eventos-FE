import { useEffect, useRef, useState } from 'react'
import { aDate, aISO, hoyISO, sumarDias } from '../lib/fechas.js'
import './selectorfecha.css'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS_CORTOS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']
const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

const primeroDelMes = (iso) => `${iso.slice(0, 7)}-01`

function sumarMeses(iso, n) {
  const d = aDate(primeroDelMes(iso))
  d.setMonth(d.getMonth() + n)
  return aISO(d)
}

// 6 semanas (42 días) que empiezan el lunes anterior o igual al día 1 del mes.
function diasDeLaGrilla(mesISO) {
  const inicio = aDate(primeroDelMes(mesISO))
  const corrimiento = (inicio.getDay() + 6) % 7 // lunes = 0
  const primero = sumarDias(aISO(inicio), -corrimiento)
  return Array.from({ length: 42 }, (_, i) => sumarDias(primero, i))
}

const formatoCorto = (iso) => {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

const nombreCompleto = (iso) => {
  const d = aDate(iso)
  return `${DIAS_LARGOS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

// Calendario propio con la estética de Chronos. Reemplaza al <input type="date">
// porque el calendario nativo del navegador no se puede pintar por dentro.
export default function SelectorFecha({
  id,
  value,
  onChange,
  min,
  placeholder = 'Elige una fecha',
  etiqueta,
  invalido = false,
  describedBy,
}) {
  const hoy = hoyISO()
  const [abierto, setAbierto] = useState(false)
  const [foco, setFoco] = useState(value || hoy) // día que tiene el foco del teclado
  const refRaiz = useRef(null)
  const refBoton = useRef(null)
  const refGrilla = useRef(null)

  const mes = primeroDelMes(foco)
  const dias = diasDeLaGrilla(mes)
  const [anio, numMes] = mes.split('-').map(Number)
  const deshabilitado = (iso) => Boolean(min) && iso < min

  function abrir() {
    setFoco(value || (min && hoy < min ? min : hoy))
    setAbierto(true)
  }

  function cerrar(devolverFoco = true) {
    setAbierto(false)
    if (devolverFoco) requestAnimationFrame(() => refBoton.current?.focus())
  }

  function elegir(iso) {
    if (deshabilitado(iso)) return
    onChange(iso)
    cerrar()
  }

  // Al abrir o mover el foco, se lleva el foco real al botón del día.
  useEffect(() => {
    if (!abierto) return
    refGrilla.current?.querySelector(`[data-iso="${foco}"]`)?.focus()
  }, [abierto, foco])

  // Clic fuera del calendario: se cierra sin cambiar nada.
  useEffect(() => {
    if (!abierto) return
    const alClic = (e) => {
      if (!refRaiz.current?.contains(e.target)) cerrar(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [abierto])

  // Mueve el foco sin dejarlo caer en un día bloqueado (antes de "min").
  const moverA = (iso) => setFoco(deshabilitado(iso) ? min : iso)

  function teclado(e) {
    const movimientos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (movimientos[e.key] !== undefined) {
      e.preventDefault()
      moverA(sumarDias(foco, movimientos[e.key]))
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      moverA(sumarMeses(foco, e.key === 'PageUp' ? -1 : 1))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const lunes = (aDate(foco).getDay() + 6) % 7
      moverA(sumarDias(foco, e.key === 'Home' ? -lunes : 6 - lunes))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      elegir(foco)
    }
  }

  return (
    <div className="selector-fecha" ref={refRaiz}>
      <button
        type="button"
        id={id}
        ref={refBoton}
        className={'selector-fecha__campo' + (invalido ? ' selector-fecha__campo--error' : '')}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-invalid={invalido ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-label={etiqueta ? `${etiqueta}, ${value ? formatoCorto(value) : placeholder}` : undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
      >
        <span className={value ? '' : 'selector-fecha__placeholder'}>
          {value ? formatoCorto(value) : placeholder}
        </span>
        <svg className="selector-fecha__icono" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
          <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
        </svg>
      </button>

      {abierto && (
        <div
          className="selector-fecha__panel"
          role="dialog"
          aria-modal="false"
          aria-label="Elegir fecha"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              cerrar()
            }
          }}
        >
          <div className="selector-fecha__cabecera">
            <button
              type="button"
              className="selector-fecha__nav"
              aria-label="Mes anterior"
              onClick={() => moverA(sumarMeses(foco, -1))}
            >
              ‹
            </button>
            <span className="selector-fecha__mes" aria-live="polite">
              {MESES[numMes - 1].charAt(0).toUpperCase() + MESES[numMes - 1].slice(1)} de {anio}
            </span>
            <button
              type="button"
              className="selector-fecha__nav"
              aria-label="Mes siguiente"
              onClick={() => setFoco(sumarMeses(foco, 1))}
            >
              ›
            </button>
          </div>

          <div className="selector-fecha__grilla" role="grid" ref={refGrilla} onKeyDown={teclado}>
            <div className="selector-fecha__fila" role="row">
              {DIAS_CORTOS.map((d, i) => (
                <span key={d} className="selector-fecha__semana" role="columnheader" aria-label={DIAS_LARGOS[i]}>
                  {d}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, s) => (
              <div className="selector-fecha__fila" role="row" key={s}>
                {dias.slice(s * 7, s * 7 + 7).map((iso) => {
                  const fueraDeMes = iso.slice(0, 7) !== mes.slice(0, 7)
                  const clases = ['selector-fecha__dia']
                  if (fueraDeMes) clases.push('selector-fecha__dia--fuera')
                  if (iso === hoy) clases.push('selector-fecha__dia--hoy')
                  if (iso === value) clases.push('selector-fecha__dia--elegido')
                  return (
                    <span role="gridcell" key={iso} aria-selected={iso === value}>
                      <button
                        type="button"
                        data-iso={iso}
                        className={clases.join(' ')}
                        tabIndex={iso === foco ? 0 : -1}
                        disabled={deshabilitado(iso)}
                        aria-label={`${nombreCompleto(iso)}${iso === hoy ? ', hoy' : ''}`}
                        aria-current={iso === hoy ? 'date' : undefined}
                        onClick={() => elegir(iso)}
                      >
                        {Number(iso.slice(8))}
                      </button>
                    </span>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="selector-fecha__pie">
            <span className="selector-fecha__leyenda">
              <i className="selector-fecha__punto" aria-hidden="true" /> Hoy
            </span>
            <button
              type="button"
              className="selector-fecha__hoy"
              disabled={deshabilitado(hoy)}
              onClick={() => elegir(hoy)}
            >
              Elegir hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}