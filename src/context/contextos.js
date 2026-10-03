import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export const AvisosContext = createContext(null)
export const EventosContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export function useAvisos() {
  const ctx = useContext(AvisosContext)
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>')
  return ctx
}

export function useEventos() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventos debe usarse dentro de <EventosProvider>')
  return ctx
}