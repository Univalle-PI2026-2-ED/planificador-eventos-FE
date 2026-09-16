import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './crear.css'

export default function Crear() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [hora, setHora] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: POST a la API real (Backend). Por ahora solo navega de vuelta.
    console.log('Crear evento:', { titulo, hora })
    navigate('/hoy')
  }

  return (
    <div className="crear">
      <h1 className="crear__title">Nuevo evento</h1>
      <form className="crear__form" onSubmit={handleSubmit}>
        <label className="campo">
          <span>Título</span>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Reunión de acuerdos"
            required
          />
        </label>

        <label className="campo">
          <span>Hora</span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn btn--full">Guardar evento</button>
      </form>
    </div>
  )
}
