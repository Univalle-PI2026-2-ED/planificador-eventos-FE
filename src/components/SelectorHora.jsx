import { useEffect, useRef, useState } from 'react'
import './selectorfecha.css'
import './selectorhora.css'

const dos = (n) => String(n).padStart(2, '0')
const HORAS = Array.from({ length: 12 }, (_, i) => i + 1) // 1 … 12
const MINUTOS = Array.from({ length: 60 }, (_, i) => i) // 0 … 59
const PERIODOS = ['am', 'pm']
const TEXTO_PERIODO = { am: 'a. m.', pm: 'p. m.' }

// "HH:mm" (24 h) → { h: 1-12, m: 0-59, p: 'am' | 'pm' }. Sin valor, parte de las 9:00 a. m.
function partes(valor) {
  const [hh, mm] = String(valor || '09:00').slice(0, 5).split(':').map(Number)
  return { h: hh % 12 || 12, m: mm || 0, p: hh < 12 ? 'am' : 'pm' }
}

// { h, m, p } → "HH:mm" (24 h), el mismo formato que daba el <input type="time">
const aValor = ({ h, m, p }) => `${dos((h % 12) + (p === 'pm' ? 12 : 0))}:${dos(m)}`

const textoHora = (valor) => {
  const { h, m, p } = partes(valor)
  return `${dos(h)}:${dos(m)} ${TEXTO_PERIODO[p]}`
}

// Selector de hora propio con la estética de Chronos. Reemplaza al <input type="time">
// porque el desplegable nativo del navegador no se puede pintar por dentro.
export default function SelectorHora({
  id,
  value,
  onChange,
  placeholder = '--:-- --',
  etiqueta,
  invalido = false,
  describedBy,
}) {
  const [abierto, setAbierto] = useState(false)
  const refRaiz = useRef(null)
  const refBoton = useRef(null)
  const refPanel = useRef(null)
  const actual = partes(value)

  function cerrar(devolverFoco = true) {
    setAbierto(false)
    if (devolverFoco) requestAnimationFrame(() => refBoton.current?.focus())
  }

  function cambiar(campo, dato) {
    onChange(aValor({ ...actual, [campo]: dato }))
  }

  // Al abrir, se lleva el foco a la hora elegida.
  useEffect(() => {
    if (!abierto) return
    refPanel.current?.querySelector('[data-col="h"] [aria-selected="true"]')?.focus()
  }, [abierto])

  // Cada columna se desplaza para dejar visible (y centrado) el valor elegido.
  useEffect(() => {
    if (!abierto) return
    refPanel.current?.querySelectorAll('.selector-hora__columna').forEach((col) => {
      const el = col.querySelector('[aria-selected="true"]')
      if (el) col.scrollTop = el.offsetTop - col.clientHeight / 2 + el.offsetHeight / 2
    })
  }, [abierto, value])

  // Clic fuera del panel: se cierra sin cambiar nada.
  useEffect(() => {
    if (!abierto) return
    const alClic = (e) => {
      if (!refRaiz.current?.contains(e.target)) cerrar(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [abierto])

  // Flechas arriba/abajo dentro de una columna: cambian el valor de esa columna.
  function teclado(e, campo, lista) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const i = lista.indexOf(actual[campo])
      const siguiente = lista[(i + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % lista.length]
      cambiar(campo, siguiente)
      requestAnimationFrame(() =>
        refPanel.current?.querySelector(`[data-col="${campo}"] [aria-selected="true"]`)?.focus(),
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      cerrar()
    }
  }

  const columna = (campo, lista, nombre, texto) => (
    <div className="selector-hora__grupo">
      <span className="selector-fecha__semana" aria-hidden="true">{nombre}</span>
      <div
        className="selector-hora__columna"
        role="listbox"
        aria-label={nombre}
        data-col={campo}
        onKeyDown={(e) => teclado(e, campo, lista)}
      >
        {lista.map((dato) => {
          const elegido = actual[campo] === dato && Boolean(value)
          return (
            <button
              type="button"
              key={dato}
              role="option"
              aria-selected={elegido}
              tabIndex={actual[campo] === dato ? 0 : -1}
              className={'selector-hora__opcion' + (elegido ? ' selector-hora__opcion--elegida' : '')}
              onClick={() => cambiar(campo, dato)}
            >
              {texto(dato)}
            </button>
          )
        })}
      </div>
    </div>
  )

  const texto = value ? textoHora(value) : placeholder

  return (
    <div className="selector-fecha selector-hora" ref={refRaiz}>
      <button
        type="button"
        id={id}
        ref={refBoton}
        className={'selector-fecha__campo' + (invalido ? ' selector-fecha__campo--error' : '')}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-invalid={invalido ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-label={etiqueta ? `${etiqueta}, ${texto}` : undefined}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
      >
        <span className={value ? '' : 'selector-fecha__placeholder'}>{texto}</span>
        <svg className="selector-fecha__icono" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 6v4.25l2.75 1.75" />
        </svg>
      </button>

      {abierto && (
        <div
          className="selector-fecha__panel selector-hora__panel"
          role="dialog"
          aria-modal="false"
          aria-label="Elegir hora"
          ref={refPanel}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              cerrar()
            }
          }}
        >
          <div className="selector-hora__columnas">
            {columna('h', HORAS, 'HORA', dos)}
            {columna('m', MINUTOS, 'MIN', dos)}
            {columna('p', PERIODOS, 'A. M./P. M.', (p) => TEXTO_PERIODO[p])}
          </div>

          <div className="selector-fecha__pie">
            <span className="selector-hora__vista num">{texto}</span>
            <button type="button" className="selector-fecha__hoy" onClick={() => cerrar()}>
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}