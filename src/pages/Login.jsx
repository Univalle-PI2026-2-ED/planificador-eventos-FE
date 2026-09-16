import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login.css'

export default function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [errores, setErrores] = useState({})

  function handleSubmit(e) {
    e.preventDefault()
    const nuevos = {}
    if (!/\S+@\S+\.\S+/.test(correo)) nuevos.correo = 'Escribe un correo con formato válido.'
    if (clave.length < 6) nuevos.clave = 'La contraseña tiene al menos 6 caracteres.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    // TODO (Backend, Sprint 2): POST /auth/login, guardar el token y proteger
    // las rutas privadas. Mientras tanto se entra con usuario demo.
    navigate('/hoy')
  }

  return (
    <div className="login">
      <div className="login__caja">
        <span className="brand login__brand">hoy</span>
        <h1 className="login__title">Entra a tu día</h1>
        <p className="login__intro">
          Organiza los eventos que produces y las gestiones de cada uno.
        </p>

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
            <input
              id="clave"
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              aria-invalid={errores.clave ? 'true' : undefined}
              aria-describedby={errores.clave ? 'err-clave' : undefined}
            />
            {errores.clave && <p className="campo__error" id="err-clave">{errores.clave}</p>}
          </div>

          <button type="submit" className="btn btn--full">Entrar</button>
        </form>

        <button type="button" className="btn--texto login__demo" onClick={() => navigate('/hoy')}>
          Entrar con el usuario demo
        </button>
      </div>
    </div>
  )
}
