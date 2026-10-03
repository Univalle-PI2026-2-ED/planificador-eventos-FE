import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/contextos.js'
import { fechaLarga, hoyISO } from '../lib/fechas.js'
import './login.css'
import InputClave from '../components/InputClave.jsx'

export default function Login() {
  const location = useLocation()
  const registrado = location.state?.registrado
  const { autenticado, iniciarSesion } = useAuth()
  const [correo, setCorreo] = useState(location.state?.correo ?? '')
  const [clave, setClave] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tardando, setTardando] = useState(false)

  if (autenticado) return <Navigate to="/hoy" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorGeneral('')
    const nuevos = {}
    if (!/\S+@\S+\.\S+/.test(correo)) nuevos.correo = 'Escribe un correo con formato válido.'
    if (clave.length < 6) nuevos.clave = 'La contraseña tiene al menos 6 caracteres.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    // Si el servidor tarda (arranque en frío), se avisa en vez de dejar el botón mudo
    const aviso = setTimeout(() => setTardando(true), 4000)
    try {
      await iniciarSesion({ correo, clave })
      // al guardarse la sesión, el <Navigate> de arriba lleva a /hoy
    } catch (err) {
      const mensaje = err.detalle?.error?.details?.non_field_errors?.[0]
      if (mensaje) {
        setErrorGeneral(mensaje)
      } else if (err.name === 'AbortError') {
        setErrorGeneral('El servidor tardó demasiado en responder. Inténtalo de nuevo en un momento.')
      } else if (err.status === undefined) {
        setErrorGeneral('No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.')
      } else {
        setErrorGeneral('No pudimos iniciar sesión. Inténtalo de nuevo en un momento.')
      }
    } finally {
      clearTimeout(aviso)
      setTardando(false)
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <header className="login__top">
        <span className="brand">Chronos</span>
        <p className="date">{fechaLarga(hoyISO())}</p>
      </header>

      <main className="login__main">
        <div className="login__caja">
          <h1 className="login__title">Entra a tu día</h1>
          <p className="login__intro">
            Organiza los eventos que produces y las gestiones de cada uno.
          </p>

          {registrado && (
            <p className="login__aviso" role="status">
              Tu cuenta quedó creada. Inicia sesión para entrar.
            </p>
          )}

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <div className={'campo' + (errores.correo ? ' campo--error' : '')}>
              <label className="campo__label" htmlFor="correo">Correo</label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                aria-invalid={errores.correo ? 'true' : undefined}
                aria-describedby={errores.correo ? 'err-correo' : undefined}
              />
              {errores.correo && <p className="campo__error" id="err-correo">{errores.correo}</p>}
            </div>

            <div className={'campo' + (errores.clave ? ' campo--error' : '')}>
              <label className="campo__label" htmlFor="clave">Contraseña</label>
               <InputClave
                id="clave"
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                aria-invalid={errores.clave ? 'true' : undefined}
                aria-describedby={errores.clave ? 'err-clave' : undefined}
              />
              {errores.clave && <p className="campo__error" id="err-clave">{errores.clave}</p>}
            </div>

            {errorGeneral && (
              <p className="campo__error" role="alert">{errorGeneral}</p>
            )}

            <button type="submit" className="btn btn--full" disabled={enviando} aria-busy={enviando}>
              {enviando ? (
                <>
                  <span className="reloj-espera" aria-hidden="true" />
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>

            {tardando && (
              <p className="login__espera" role="status">
                El servidor está despertando; la primera vez puede tardar hasta un minuto.
              </p>
            )}
          </form>

          <p className="login__pie">
            ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
          </p>
        </div>
      </main>
    </div>
  )
}