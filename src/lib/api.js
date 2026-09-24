const BASE_URL = import.meta.env.VITE_API_URL

async function manejarRespuesta(res) {
  if (!res.ok) {
    let detalle = null
    try {
      detalle = await res.json()
    } catch {
      // el error no trajo JSON (ej. 500 sin cuerpo)
    }
    const error = new Error('Error en la petición a la API')
    error.status = res.status
    error.detalle = detalle
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

export function listarEventos() {
  return fetch(`${BASE_URL}/eventos/`).then(manejarRespuesta)
}

export function crearEventoApi({ nombre, fecha, gestiones }) {
  return fetch(`${BASE_URL}/eventos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, fecha, gestiones }),
  }).then(manejarRespuesta)
}

export function eliminarEventoApi(id) {
  return fetch(`${BASE_URL}/eventos/${id}/`, { method: 'DELETE' }).then(manejarRespuesta)
}

export function editarGestionApi(id, cambios) {
  return fetch(`${BASE_URL}/gestiones/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios),
  }).then(manejarRespuesta)
}

export function eliminarGestionApi(id) {
  return fetch(`${BASE_URL}/gestiones/${id}/`, { method: 'DELETE' }).then(manejarRespuesta)
}