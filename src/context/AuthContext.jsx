import { useCallback, useEffect, useMemo, useState } from 'react'
import { loginApi, registroApi } from '../lib/api.js'
import { borrarSesion, guardarSesion, leerSesion } from '../lib/sesion.js'
import { AuthContext } from './contextos.js'

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion())

  const iniciarSesion = useCallback(async (credenciales) => {
    const data = await loginApi(credenciales) // { token, user }
    guardarSesion(data)
    setSesion(data)
    return data
  }, [])

const registrar = useCallback(async (datos) => {
    // Solo crea la cuenta: no inicia sesión. El usuario entra después por el login.
    return registroApi(datos)
  }, [])

  const cerrarSesion = useCallback(() => {
    borrarSesion()
    setSesion(null)
  }, [])

  // api.js avisa con este evento cuando el servidor responde 401
  useEffect(() => {
    const alExpirar = () => setSesion(null)
    window.addEventListener('sesion-expirada', alExpirar)
    return () => window.removeEventListener('sesion-expirada', alExpirar)
  }, [])

  const valor = useMemo(
    () => ({
      usuario: sesion?.user ?? null,
      autenticado: Boolean(sesion?.token),
      iniciarSesion,
     registrar,
      cerrarSesion,   
    }),
    [sesion, iniciarSesion, registrar, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}