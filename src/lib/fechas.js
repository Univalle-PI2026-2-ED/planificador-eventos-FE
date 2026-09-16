// Utilidades de fecha y formato. Todo se maneja con cadenas ISO "YYYY-MM-DD"
// para que el día viaje igual hacia el backend y no dependa de la zona horaria.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function aDate(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function aISO(fecha) {
  const p = (n) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`
}

export const hoyISO = () => aISO(new Date())

export function sumarDias(iso, n) {
  const d = aDate(iso)
  d.setDate(d.getDate() + n)
  return aISO(d)
}

export function diasEntre(desdeISO, hastaISO) {
  return Math.round((aDate(hastaISO) - aDate(desdeISO)) / 86400000)
}

export function fechaLarga(iso) {
  const d = aDate(iso)
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

// "hoy", "mañana" o "viernes 18": lo que diría una persona, no una fecha cruda.
export function nombreDia(iso) {
  const dif = diasEntre(hoyISO(), iso)
  if (dif === 0) return 'hoy'
  if (dif === 1) return 'mañana'
  if (dif === -1) return 'ayer'
  const d = aDate(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()}`
}

export const minutosDe = (hora) => {
  const [h, m] = String(hora).split(':').map(Number)
  return h * 60 + m
}

export const minutosAhora = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export const aHora = (minutos) => {
  const t = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutos)))
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export const formatoHoras = (n) =>
  `${Number(n).toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`

export const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)
