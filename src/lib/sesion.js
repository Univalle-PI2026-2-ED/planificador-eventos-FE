// Guarda { token, user } solo mientras la pestaña esté abierta (sessionStorage):
// al cerrar la pestaña o el navegador hay que iniciar sesión de nuevo.
const CLAVE = 'chronos_sesion'

// Limpia la sesión vieja que antes se guardaba de forma permanente
try {
  localStorage.removeItem(CLAVE)
} catch {
  // sin acceso a localStorage
}

export function leerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE))
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
}

export function borrarSesion() {
  sessionStorage.removeItem(CLAVE)
}

export const tokenActual = () => leerSesion()?.token ?? null