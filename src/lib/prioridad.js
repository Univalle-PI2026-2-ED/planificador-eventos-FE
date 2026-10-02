import { hoyISO, minutosAhora, minutosDe } from './fechas.js'

// Reglas de prioridad de la vista "Hoy" (T2). Se documentan en pantalla:
// vencida si ya pasó su hora, urgente si faltan 90 minutos o menos.
export const UMBRAL_URGENTE_MIN = 90

export function clasificar(gestion, hoy = hoyISO(), ahora = minutosAhora()) {
  if (gestion.estado === 'hecho') return 'hecho'
  if (gestion.estado === 'pospuesto') return 'pospuesto'
  if (gestion.fecha > hoy) return 'proximo'
  if (gestion.fecha < hoy) return 'vencido'

  const faltan = minutosDe(gestion.hora) - ahora
  if (faltan < 0) return 'vencido'
  if (faltan <= UMBRAL_URGENTE_MIN) return 'urgente'
  return 'proximo'
}

export const ETIQUETA = {
  vencido: 'Vencida',
  urgente: 'Urgente',
  proximo: 'Próxima',
  hecho: 'Hecha',
  pospuesto: 'Pospuesta',
}

export const PRIORIDAD = { vencido: 0, urgente: 1, proximo: 2, pospuesto: 3, hecho: 4 }

// Microtexto de la etiqueta urgente: "En 40 min" comunica mejor que "Urgente".
export function cuantoFalta(gestion, ahora = minutosAhora()) {
  const faltan = minutosDe(gestion.hora) - ahora
  if (faltan <= 0) return 'Ahora'
  if (faltan < 60) return `En ${faltan} min`
  return `En ${Math.round(faltan / 60)} h`
}

// Una gestión de un día anterior que nadie cerró ni pospuso: sigue siendo
// trabajo pendiente y debe seguir visible en "Hoy".
export const esAtrasada = (gestion, hoy = hoyISO()) =>
  gestion.fecha < hoy && gestion.estado === 'pendiente'
