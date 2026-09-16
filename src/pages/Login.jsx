import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login.css'

export default function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: conectar contra la API real de autenticación (Backend).
    console.log('Login:', { correo, clave })
    navigate('/hoy')
  }

  return (
    <div className="login">
      <h1 className="login__title">Iniciar sesión</h1>
      <form className="login__form" onSubmit={handleSubmit}>
        <label className="campo">
          <span>Correo</span>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            required
          />
        </label>

        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit" className="btn btn--full">Entrar</button>
      </form>
    </div>
  )
}
