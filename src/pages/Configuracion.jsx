import { useEffect, useState } from 'react'
import { useEventos, useAvisos } from '../context/contextos.js'
import './configuracion.css'

export default function Configuracion() {
  const { limiteHoras, guardarLimiteHoras } = useEventos()
  const { avisar } = useAvisos()

  const [limite, setLimite] = useState(String(limiteHoras))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setLimite(String(limiteHoras))
  }, [limiteHoras])

  async function guardar(e) {
    e.preventDefault()
    setError('')

    const valorLimite = Number(limite)

    if (
      limite.trim() === '' ||
      !Number.isFinite(valorLimite) ||
      valorLimite < 1 ||
      valorLimite > 12 ||
      valorLimite * 2 !== Math.round(valorLimite * 2)
    ) {
      setError('El límite debe estar entre 1 y 12 horas, en pasos de 0.5.')
      return
    }

    try {
      setGuardando(true)
      await guardarLimiteHoras(valorLimite)
      avisar('Límite diario actualizado correctamente.')
    } catch {
      setError('No se pudo guardar el límite. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="vista configuracion">
      <header className="configuracion__encabezado">
        <p className="configuracion__etiqueta">PREFERENCIAS</p>
        <h1 className="configuracion__titulo">Configuración</h1>
        <p className="configuracion__intro">
          Personaliza cómo organizas tu tiempo en Chronos.
        </p>
      </header>

      <section className="configuracion__panel">
        <div className="configuracion__panel-cabecera">
          <span className="configuracion__icono" aria-hidden="true">
            ◷
          </span>
          <div>
            <h2>Límite de horas al día</h2>
            <p>
              Define cuántas horas puedes dedicar a tus gestiones
              en un mismo día.
            </p>
          </div>
        </div>

        <form className="configuracion__form" onSubmit={guardar} noValidate>
          <div className="configuracion__campo">
            <label htmlFor="limite-horas">
              Máximo de horas diarias
            </label>

            <div className="configuracion__entrada">
              <input
                id="limite-horas"
                name="limite-horas"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={limite}
                onChange={(e) => {
                  setLimite(e.target.value)
                  setError('')
                }}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'error-limite' : 'ayuda-limite'}
                required
              />
              <span>horas al día</span>
            </div>

            {error ? (
              <p className="configuracion__error" id="error-limite" role="alert">
                {error}
              </p>
            ) : (
              <p className="configuracion__ayuda" id="ayuda-limite">
                Valores de 1 a 12 horas, en incrementos de media hora.
              </p>
            )}
          </div>

          <div className="configuracion__nota">
            <span aria-hidden="true">ⓘ</span>
            <p>
              Este límite se aplica a todas tus gestiones pendientes,
              aunque pertenezcan a eventos diferentes.
            </p>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={guardando}
            aria-busy={guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </form>
      </section>
    </div>
  )
}