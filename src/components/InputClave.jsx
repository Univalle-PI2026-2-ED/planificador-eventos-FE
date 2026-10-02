import { useState } from 'react'
import './inputclave.css'

// Campo de contraseña con botón de ojo para mostrar/ocultar lo escrito.
export default function InputClave({ id, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="clave">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        spellCheck={false}
        autoCapitalize="off"
        {...props}
      />
      <button
        type="button"
        className="clave__ojo"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        {visible ? (
          // ojo abierto: la contraseña se ve
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.8 10C3.6 6.6 6.5 4.8 10 4.8s6.4 1.8 8.2 5.2c-1.8 3.4-4.7 5.2-8.2 5.2S5.4 13.4 1.8 10Z" />
            <circle cx="10" cy="10" r="2.6" />
          </svg>
        ) : (
          // ojo cerrado: la contraseña está oculta
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.5 8.5C4.4 11.6 7 13 10 13s5.6-1.4 7.5-4.5" />
            <path d="M5.2 11.5 3.9 13.6M10 13v2.2M14.8 11.5l1.3 2.1" />
          </svg>
        )}
      </button>
    </div>
  )
}