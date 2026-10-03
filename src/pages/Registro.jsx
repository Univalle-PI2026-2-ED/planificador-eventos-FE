import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/contextos.js'
import { fechaLarga, hoyISO } from '../lib/fechas.js'
import InputClave from '../components/InputClave.jsx'
import './login.css'

export default function Registro() {
  const navigate = useNavigate()
  const { autenticado, registrar } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado) return <Navigate to="/hoy" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorGeneral('')
    const nuevos = {}
    if (!usuario.trim()) nuevos.usuario = 'Escribe un nombre de usuario.'
    if (!/\S+@\S+\.\S+/.test(correo)) nuevos.correo = 'Escribe un correo con formato válido.'
    if (clave.length < 8) nuevos.clave = 'La contraseña debe tener al menos 8 caracteres.'
    if (confirmar !== clave) nuevos.confirmar = 'Las contraseñas no coinciden.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      await registrar({ usuario, correo, clave })
      navigate('/login', { replace: true, state: { registrado: true, correo: correo.trim() } })
    } catch (err) {
      const d = err.detalle?.error?.details
      const delServidor = {}
      if (d?.username?.[0]) delServidor.usuario = d.username[0]
      if (d?.email?.[0]) delServidor.correo = d.email[0]
      if (d?.password?.length) delServidor.clave = d.password.join(' ')

      if (Object.keys(delServidor).length > 0) {
        setErrores(delServidor)
      } else if (err.status === undefined) {
        setErrorGeneral('No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.')
      } else {
        setErrorGeneral('No pudimos crear tu cuenta. Inténtalo de nuevo en un momento.')
      }
    } finally {
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
          <h1 className="login__title">Crea tu cuenta</h1>
          <p className="login__intro">
            Regístrate para organizar tus eventos y las gestiones de cada uno.
          </p>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <div className={'campo' + (errores.usuario ? ' campo--error' : '')}>
              <label className="campo__label" htmlFor="usuario">Usuario</label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="tu_usuario"
                aria-invalid={errores.usuario ? 'true' : undefined}
                aria-describedby={errores.usuario ? 'err-usuario' : 'ayuda-usuario'}
              />
              {errores.usuario ? (
                <p className="campo__error" id="err-usuario">{errores.usuario}</p>
              ) : (
                <p className="campo__ayuda" id="ayuda-usuario">
                  Letras, números y los símbolos @ . + - _
                </p>
              )}
            </div>

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
                autoComplete="new-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                aria-invalid={errores.clave ? 'true' : undefined}
                aria-describedby={errores.clave ? 'err-clave' : undefined}
              />
              {errores.clave && <p className="campo__error" id="err-clave">{errores.clave}</p>}
            </div>

            <div className={'campo' + (errores.confirmar ? ' campo--error' : '')}>
              <label className="campo__label" htmlFor="confirmar">Confirmar contraseña</label>
             <InputClave
                id="confirmar"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                aria-invalid={errores.confirmar ? 'true' : undefined}
                aria-describedby={errores.confirmar ? 'err-confirmar' : undefined}
              />
              {errores.confirmar && <p className="campo__error" id="err-confirmar">{errores.confirmar}</p>}
            </div>

            {errorGeneral && (
              <p className="campo__error" role="alert">{errorGeneral}</p>
            )}

            <button type="submit" className="btn btn--full" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="login__pie">
            ¿Ya tienes cuenta? <Link to="/login">Entra aquí</Link>
          </p>
        </div>
      </main>
    </div>
  )
}