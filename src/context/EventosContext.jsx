import { useCallback, useEffect, useMemo, useState } from 'react'
import { aHora, minutosAhora } from '../lib/fechas.js'
import {
  listarEventos,
  crearEventoApi,
  eliminarEventoApi,
  editarEventoApi,
  editarGestionApi,
  reprogramarGestionApi,
  eliminarGestionApi,
  obtenerPreferenciasApi,
  guardarPreferenciasApi,
} from '../lib/api.js'
import { EventosContext, useAuth } from './contextos.js'

// Modelo: un evento tiene un plan de trabajo (gestiones logísticas) y cada
// gestión tiene día, hora, horas estimadas, estado y nota.
// Ya conectado a la API real (EDX-14): /eventos/ y /gestiones/.

export const LIMITE_POR_DEFECTO = 6

const nuevoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`


export function EventosProvider({ children }) {
  const { autenticado } = useAuth()
  const [eventos, setEventos] = useState([])
  const [limiteHoras, setLimiteHoras] = useState(LIMITE_POR_DEFECTO)
  const [estadoCarga, setEstadoCarga] = useState('cargando') // cargando | exito | error
  const [bitacora, setBitacora] = useState([])

  const guardarLimiteHoras = useCallback(async (nuevoLimite) => {
    const data = await guardarPreferenciasApi({
      limite_horas: Number(nuevoLimite),
    })

    const limiteGuardado = Number(data.limite_horas)
    setLimiteHoras(limiteGuardado)

    return limiteGuardado
  }, [])

  const pedirEventos = useCallback(() => {
    listarEventos()
      .then((data) => {
        setEventos(data)
        setEstadoCarga('exito')
      })
      .catch(() => setEstadoCarga('error'))
  }, [])

  const pedirPreferencias = useCallback(async () => {
    try {
      const data = await obtenerPreferenciasApi()
      setLimiteHoras(Number(data.limite_horas))
    } catch (error) {
      console.error('Error al cargar las preferencias:', error)
    }
  }, [])

  // para el botón "Reintentar"
  const cargar = useCallback(() => {
    setEstadoCarga('cargando')
    pedirEventos()
  }, [pedirEventos])

  useEffect(() => {
    if (autenticado) {
      pedirEventos()
      pedirPreferencias()
    }
  }, [autenticado, pedirEventos, pedirPreferencias])

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

  const obtenerEvento = useCallback(
    (id) => eventos.find((ev) => String(ev.id) === String(id)),
    [eventos],)
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

  const editarEvento = useCallback(
    async (eventoId, cambios) => {
      const payload = {}
      if (cambios.nombre != null) payload.nombre = cambios.nombre.trim()
      if (cambios.fecha != null) payload.fecha = cambios.fecha
      if (Object.keys(payload).length === 0) return
      await editarEventoApi(eventoId, payload)
      setEventos((prev) => prev.map((ev) => (ev.id === eventoId ? { ...ev, ...payload } : ev)))
      anotar('Editaste', payload.nombre || '')
    },
    [anotar],
  )

  // Edición "en frío" de los datos de una gestión (nombre/fecha/hora/horas),
  // a diferencia de reprogramarGestion, que además reabre la gestión.
  const editarGestion = useCallback(
    async (gestionId, cambios) => {
      const payload = {}
      if (cambios.nombre != null) payload.nombre = cambios.nombre.trim()
      if (cambios.fecha != null) payload.fecha = cambios.fecha
      if (cambios.hora != null) payload.hora = cambios.hora
      if (cambios.horas != null) payload.horas = Number(cambios.horas)
      if (Object.keys(payload).length === 0) return
      await editarGestionApi(gestionId, payload)
      cambiarGestion(gestionId, payload)
    },
    [cambiarGestion],
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

      const gestionActualizada = await reprogramarGestionApi(gestionId, cambios)

      cambiarGestion(gestionId, gestionActualizada)
      return gestionActualizada
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
      editarEvento,
      editarGestion,
      eliminarEvento,
      eliminarGestion,
      marcarGestion,
      guardarNota,
      reprogramarGestion,
      posponerGestion,
      guardarLimiteHoras,
    }),
    [
      eventos, gestiones, limiteHoras, guardarLimiteHoras,
      estadoCarga, cargar, bitacora, anotar,
      gestionesDelDia, horasDelDia, obtenerEvento, obtenerGestion, nombreDuplicado,
      agregarEvento, editarEvento, editarGestion, eliminarEvento, eliminarGestion,
      marcarGestion, guardarNota, reprogramarGestion, posponerGestion,
    ],
  )

  return <EventosContext.Provider value={valor}>{children}</EventosContext.Provider>
}