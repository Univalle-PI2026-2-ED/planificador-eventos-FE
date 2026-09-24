import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { aHora, minutosAhora } from '../lib/fechas.js'
import {
  listarEventos,
  crearEventoApi,
  eliminarEventoApi,
  editarGestionApi,
  eliminarGestionApi,
} from '../lib/api.js'

// Modelo: un evento tiene un plan de trabajo (gestiones logísticas) y cada
// gestión tiene día, hora, horas estimadas, estado y nota.
// Ya conectado a la API real (EDX-14): /eventos/ y /gestiones/.

export const LIMITE_POR_DEFECTO = 6

const nuevoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`

const EventosContext = createContext(null)

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState([])
  const [limiteHoras, setLimiteHoras] = useState(LIMITE_POR_DEFECTO)
  const [estadoCarga, setEstadoCarga] = useState('cargando') // cargando | exito | error
  const [bitacora, setBitacora] = useState([])

  const cargar = useCallback(() => {
    setEstadoCarga('cargando')
    listarEventos()
      .then((data) => {
        setEventos(data)
        setEstadoCarga('exito')
      })
      .catch(() => setEstadoCarga('error'))
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
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [gestiones],
  )

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

  const nombreDuplicado = useCallback(
    (nombre, excluirId = null) =>
      eventos.some(
        (ev) => ev.id !== excluirId && ev.nombre.trim().toLowerCase() === nombre.trim().toLowerCase(),
      ),
    [eventos],
  )

  const agregarEvento = useCallback(
    async ({ nombre, fecha, gestiones: plan }) => {
      const payload = {
        nombre: nombre.trim(),
        fecha,
        gestiones: plan.map((g) => ({
          nombre: g.nombre.trim(),
          fecha: g.fecha,
          hora: g.hora,
          horas: Number(g.horas) || 1,
          estado: 'pendiente',
          nota: '',
        })),
      }
      const nuevo = await crearEventoApi(payload)
      setEventos((prev) => [...prev, nuevo])
      anotar('Creaste', nuevo.nombre, `con ${nuevo.gestiones.length} gestiones`)
      return nuevo
    },
    [anotar],
  )

  const eliminarEvento = useCallback(
    async (eventoId) => {
      const ev = eventos.find((e) => e.id === eventoId)
      await eliminarEventoApi(eventoId)
      setEventos((prev) => prev.filter((e) => e.id !== eventoId))
      if (ev) anotar('Eliminaste', ev.nombre)
    },
    [anotar, eventos],
  )

  const eliminarGestion = useCallback(
    async (gestionId) => {
      const g = gestiones.find((x) => x.id === gestionId)
      await eliminarGestionApi(gestionId)
      setEventos((prev) =>
        prev.map((ev) => ({
          ...ev,
          gestiones: ev.gestiones.filter((x) => x.id !== gestionId),
        })),
      )
      if (g) anotar('Eliminaste', g.nombre)
    },
    [anotar, gestiones],
  )

  const marcarGestion = useCallback(
    async (gestionId, estado) => {
      const g = gestiones.find((x) => x.id === gestionId)
      await editarGestionApi(gestionId, { estado })
      cambiarGestion(gestionId, { estado })
      if (!g) return
      if (estado === 'hecho') anotar('Marcaste como hecha', g.nombre)
      else if (estado === 'pospuesto') anotar('Pospusiste', g.nombre)
      else anotar('Reabriste', g.nombre)
    },
    [anotar, cambiarGestion, gestiones],
  )

  const guardarNota = useCallback(
    async (gestionId, nota) => {
      await editarGestionApi(gestionId, { nota })
      cambiarGestion(gestionId, { nota })
    },
    [cambiarGestion],
  )

  const reprogramarGestion = useCallback(
    async (gestionId, { fecha, horas }) => {
      const cambios = { fecha, estado: 'pendiente' }
      if (horas != null) cambios.horas = Number(horas)
      await editarGestionApi(gestionId, cambios)
      cambiarGestion(gestionId, cambios)
    },
    [cambiarGestion],
  )

  const posponerGestion = useCallback(
    async (gestionId, fecha) => {
      await editarGestionApi(gestionId, { fecha, estado: 'pospuesto' })
      cambiarGestion(gestionId, { fecha, estado: 'pospuesto' })
    },
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
      nombreDuplicado,
      agregarEvento,
      eliminarEvento,
      eliminarGestion,
      marcarGestion,
      guardarNota,
      reprogramarGestion,
      posponerGestion,
    }),
    [
      eventos, gestiones, limiteHoras, estadoCarga, cargar, bitacora, anotar,
      gestionesDelDia, horasDelDia, obtenerEvento, obtenerGestion, nombreDuplicado,
      agregarEvento, eliminarEvento, eliminarGestion, marcarGestion, guardarNota,
      reprogramarGestion, posponerGestion,
    ],
  )

  return <EventosContext.Provider value={valor}>{children}</EventosContext.Provider>
}

export function useEventos() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventos debe usarse dentro de <EventosProvider>')
  return ctx
}