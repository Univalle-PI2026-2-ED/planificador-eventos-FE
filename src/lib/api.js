import { borrarSesion, tokenActual } from './sesion.js'

const BASE_URL = import.meta.env.VITE_API_URL

async function manejarRespuesta(res) {
  if (!res.ok) {
    let detalle = null
    try {
      detalle = await res.json()
    } catch {
      // el error no trajo JSON (ej. 500 sin cuerpo)
    }
    if (res.status === 401) {
      // token vencido o inválido: se cierra la sesión
      borrarSesion()
      window.dispatchEvent(new Event('sesion-expirada'))
    }
    const error = new Error('Error en la petición a la API')
    error.status = res.status
    error.detalle = detalle
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

// Render (plan gratis) puede tardar ~1 min en despertar: más que eso, se corta.
const TIMEOUT_MS = 60000

function peticion(ruta, { metodo = 'GET', cuerpo, publica = false } = {}) {
  const headers = {}
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenActual()
  if (token && !publica) headers.Authorization = `Token ${token}`

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  return fetch(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    signal: controlador.signal,
  })
    .then(manejarRespuesta)
    .finally(() => clearTimeout(temporizador))
}

export function loginApi({ correo, clave }) {
  return peticion('/auth/login/', {
    metodo: 'POST',
    publica: true,
    cuerpo: { email: correo.trim(), password: clave },
  })
}

export function registroApi({ usuario, correo, clave }) {
  return peticion('/auth/registro/', {
    metodo: 'POST',
    publica: true,
    cuerpo: { username: usuario.trim(), email: correo.trim(), password: clave },
  })
}

export function listarEventos() {
  return peticion('/eventos/')
}

export function crearEventoApi({ nombre, fecha, gestiones }) {
  return peticion('/eventos/', { metodo: 'POST', cuerpo: { nombre, fecha, gestiones } })
}

export function eliminarEventoApi(id) {
  return peticion(`/eventos/${id}/`, { metodo: 'DELETE' })
}

export function agregarGestionApi(eventoId, datos) {
  return peticion(`/eventos/${eventoId}/subtareas/`, { metodo: 'POST', cuerpo: datos })
}

export function editarGestionApi(id, cambios) {
  return peticion(`/gestiones/${id}/`, { metodo: 'PATCH', cuerpo: cambios })
}

export function reprogramarGestionApi(id, cambios) {
  return peticion(`/gestiones/${id}/reprogramar/`, {
    metodo: 'POST',
    cuerpo: cambios,
  })
}


export function eliminarGestionApi(id) {
  return peticion(`/gestiones/${id}/`, { metodo: 'DELETE' })
}

export function editarEventoApi(id, cambios) {
  return peticion(`/eventos/${id}/`, { metodo: 'PATCH', cuerpo: cambios })
}


export function obtenerPreferenciasApi() {
  return peticion('/preferencias/')
}

export function guardarPreferenciasApi(cambios) {
  return peticion('/preferencias/', {
    metodo: 'PATCH',
    cuerpo: cambios,
  })
}