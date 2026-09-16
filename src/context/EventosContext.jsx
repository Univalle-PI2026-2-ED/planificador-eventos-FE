import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { aHora, hoyISO, minutosAhora, minutosDe, sumarDias } from '../lib/fechas.js'

// Modelo: un evento tiene un plan de trabajo (gestiones logísticas) y cada
// gestión tiene día, hora, horas estimadas, estado y nota.
//
// TODO (Backend): reemplazar SEMILLA por GET /eventos, y agregarEvento /
// marcarGestion / reprogramarGestion por POST y PATCH. La forma del objeto ya
// está pensada para viajar como JSON tal cual.

export const LIMITE_POR_DEFECTO = 6

const nuevoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`

// Hora relativa al momento en que se abre la app, para que la demo siempre
// muestre una gestión vencida, una urgente y una próxima.
const relativa = (min) => aHora(Math.min(23 * 60 + 55, Math.max(5, minutosAhora() + min)))

function semilla() {
  const hoy = hoyISO()
  return [
    {
      id: 'evt-boda',
      nombre: 'Boda de Ana y Luis',
      fecha: sumarDias(hoy, 4),
      gestiones: [
        { id: 'g-1', nombre: 'Reservar salón Los Almendros', fecha: hoy, hora: relativa(-125), horas: 1.5, estado: 'pendiente', nota: '' },
        { id: 'g-2', nombre: 'Confirmar catering', fecha: hoy, hora: relativa(40), horas: 1, estado: 'pendiente', nota: '' },
        { id: 'g-3', nombre: 'Enviar invitaciones', fecha: hoy, hora: relativa(265), horas: 2, estado: 'pendiente', nota: '' },
        { id: 'g-4', nombre: 'Cotizar decoración floral', fecha: sumarDias(hoy, 1), hora: '10:00', horas: 2, estado: 'pendiente', nota: '' },
        { id: 'g-5', nombre: 'Cerrar lista de invitados', fecha: sumarDias(hoy, 1), hora: '14:00', horas: 3, estado: 'pendiente', nota: '' },
      ],
    },
    {
      id: 'evt-feria',
      nombre: 'Feria de emprendimiento',
      fecha: sumarDias(hoy, 12),
      gestiones: [
        { id: 'g-6', nombre: 'Buscar proveedores de sonido', fecha: hoy, hora: relativa(-300), horas: 1, estado: 'hecho', nota: 'Quedan dos cotizaciones por comparar.' },
        { id: 'g-7', nombre: 'Reservar carpas', fecha: sumarDias(hoy, 2), hora: '09:00', horas: 2, estado: 'pendiente', nota: '' },
      ],
    },
  ]
}

const EventosContext = createContext(null)

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState(semilla)
  const [limiteHoras, setLimiteHoras] = useState(LIMITE_POR_DEFECTO)
  const [estadoCarga, setEstadoCarga] = useState('cargando') // cargando | exito | error
  const [bitacora, setBitacora] = useState([])

  // Simula la latencia de la API mientras no existe el backend.
  const cargar = useCallback(() => {
    setEstadoCarga('cargando')
    const t = setTimeout(() => setEstadoCarga('exito'), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => cargar(), [cargar])

  const anotar = useCallback((accion, destacado, cola = '') => {
    setBitacora((prev) => [
      { id: nuevoId(), hora: aHora(minutosAhora()), accion, destacado, cola },
      ...prev,
    ])
  }, [])

  const cambiarGestion = useCallback((gestionId, cambios) => {
    setEventos((prev) =>
      prev.map((ev) => ({
        ...ev,
        gestiones: ev.gestiones.map((g) => (g.id === gestionId ? { ...g, ...cambios } : g)),
      })),
    )
  }, [])

  /* ---- lecturas derivadas ------------------------------------------- */

  const gestiones = useMemo(
    () => eventos.flatMap((ev) => ev.gestiones.map((g) => ({ ...g, evento: ev }))),
    [eventos],
  )

  const gestionesDelDia = useCallback(
    (iso) =>
      gestiones
        .filter((g) => g.fecha === iso)
        .sort((a, b) => minutosDe(a.hora) - minutosDe(b.hora)),
    [gestiones],
  )

  // Horas de gestión comprometidas un día (las hechas ya no pesan en la agenda).
  const horasDelDia = useCallback(
    (iso, excluirId = null) =>
      gestiones
        .filter((g) => g.fecha === iso && g.estado !== 'hecho' && g.id !== excluirId)
        .reduce((suma, g) => suma + Number(g.horas || 0), 0),
    [gestiones],
  )

  const obtenerEvento = useCallback((id) => eventos.find((ev) => ev.id === id), [eventos])
  const obtenerGestion = useCallback((id) => gestiones.find((g) => g.id === id), [gestiones])

  /* ---- acciones ------------------------------------------------------ */

  const agregarEvento = useCallback(
    ({ nombre, fecha, gestiones: plan }) => {
      const nuevo = {
        id: nuevoId(),
        nombre: nombre.trim(),
        fecha,
        gestiones: plan.map((g) => ({
          id: nuevoId(),
          nombre: g.nombre.trim(),
          fecha: g.fecha,
          hora: g.hora,
          horas: Number(g.horas) || 1,
          estado: 'pendiente',
          nota: '',
        })),
      }
      setEventos((prev) => [...prev, nuevo])
      anotar('Creaste', nuevo.nombre, `con ${nuevo.gestiones.length} gestiones`)
      return nuevo
    },
    [anotar],
  )

  const marcarGestion = useCallback(
    (gestionId, estado) => {
      const g = gestiones.find((x) => x.id === gestionId)
      cambiarGestion(gestionId, { estado })
      if (!g) return
      if (estado === 'hecho') anotar('Marcaste como hecha', g.nombre)
      else if (estado === 'pospuesto') anotar('Pospusiste', g.nombre)
      else anotar('Reabriste', g.nombre)
    },
    [anotar, cambiarGestion, gestiones],
  )

  const guardarNota = useCallback(
    (gestionId, nota) => cambiarGestion(gestionId, { nota }),
    [cambiarGestion],
  )

  const reprogramarGestion = useCallback(
    (gestionId, { fecha, horas }) => {
      // Reprogramar reactiva la gestión: vuelve a estar pendiente en el nuevo día.
      const cambios = { fecha, estado: 'pendiente' }
      if (horas != null) cambios.horas = Number(horas)
      cambiarGestion(gestionId, cambios)
    },
    [cambiarGestion],
  )

  const posponerGestion = useCallback(
    (gestionId, fecha) => cambiarGestion(gestionId, { fecha, estado: 'pospuesto' }),
    [cambiarGestion],
  )

  const valor = useMemo(
    () => ({
      eventos,
      gestiones,
      limiteHoras,
      setLimiteHoras,
      estadoCarga,
      cargar,
      bitacora,
      anotar,
      gestionesDelDia,
      horasDelDia,
      obtenerEvento,
      obtenerGestion,
      agregarEvento,
      marcarGestion,
      guardarNota,
      reprogramarGestion,
      posponerGestion,
    }),
    [
      eventos, gestiones, limiteHoras, estadoCarga, cargar, bitacora, anotar,
      gestionesDelDia, horasDelDia, obtenerEvento, obtenerGestion, agregarEvento,
      marcarGestion, guardarNota, reprogramarGestion, posponerGestion,
    ],
  )

  return <EventosContext.Provider value={valor}>{children}</EventosContext.Provider>
}

export function useEventos() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventos debe usarse dentro de <EventosProvider>')
  return ctx
}
