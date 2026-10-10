import { useEffect, useRef, useState } from 'react'
import { useEventos, useAvisos } from '../context/contextos.js'
import {
  formatoHoras,
  hoyISO,
  mayuscula,
  nombreDia,
  sumarDias,
} from '../lib/fechas.js'

export default function DialogoReprogramar({ gestion, onCerrar, onReprogramar }) {
  const ref = useRef(null)

  const {
    horasDelDia,
    gestionesDelDia,
    reprogramarGestion,
    posponerGestion,
    limiteHoras,
  } = useEventos()

  const { avisar } = useAvisos()


  const [destino, setDestino] = useState(() => sumarDias(hoyISO(), 1))
  const [estimacion, setEstimacion] = useState(1)
  const [opcion, setOpcion] = useState('')
  const [guardando, setGuardando] = useState(false)


  const limite = Number(limiteHoras) || 6

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return

    if (gestion) {
      setDestino(sumarDias(hoyISO(), 1))
      setEstimacion(Math.max(0.5, Number(gestion.horas) || 0.5))
      setOpcion('')

      if (!dlg.open) dlg.showModal()
    } else if (dlg.open) {
      dlg.close()
    }
  }, [gestion])

  if (!gestion) {
    return <dialog className="dialogo" ref={ref} onClose={onCerrar} />
  }

  const dias = Array.from(
    { length: 5 },
    (_, i) => sumarDias(hoyISO(), i + 1)
  )

  const libres = (iso) => horasDelDia(iso, gestion.id)
  const horasGestion = Number(gestion.horas) || 0
  const horasPropuestas = Number(estimacion)

  const estimacionValida =
    Number.isFinite(horasPropuestas) &&
    horasPropuestas >= 0.5 &&
    Math.round(horasPropuestas * 2) === horasPropuestas * 2

  const yaPlaneado = libres(destino)
  const total = yaPlaneado + (estimacionValida ? horasPropuestas : 0)
  const excede = total > limite
  const margen = Math.max(0, limite - yaPlaneado)

  const diaLibre = dias.find(
    (d) => libres(d) + horasPropuestas <= limite
  )

  const candidata = gestionesDelDia(destino)
    .filter((g) => g.estado !== 'hecho' && g.estado !== 'pospuesto' && g.id !== gestion.id)
    .sort((a, b) => Number(b.horas) - Number(a.horas))[0]

  const opciones = []

  if (diaLibre && excede) {
    opciones.push({
      valor: 'mover',
      titulo: `Llevarla a ${nombreDia(diaLibre)}`,
      detalle: `Ese día quedaría en ${formatoHoras(
        libres(diaLibre) + horasPropuestas
      )}, dentro de tu límite.`,
    })
  }

  if (excede && margen >= 0.5) {
    opciones.push({
      valor: 'reducir',
      titulo: `Reducir la estimación a ${formatoHoras(margen)}`,
      detalle: `El día quedaría en el límite de ${formatoHoras(limite)}.`,
    })
  }

  if (excede && candidata && total - Number(candidata.horas) <= limite) {
    opciones.push({
      valor: 'posponer',
      titulo: `Posponer "${candidata.nombre}"`,
      detalle: `Libera ${formatoHoras(candidata.horas)} de ${nombreDia(
        destino
      )} y esa gestión queda marcada como pospuesta.`,
    })
  }

  async function confirmar() {

    if (guardando) return

    if (!estimacionValida) {
      avisar('La estimación debe ser de al menos 0,5 horas y avanzar en intervalos de 0,5.')
      return
    }

    setGuardando(true)
    let resultado = null

    try {
      if (!excede) {
        resultado = await reprogramarGestion(gestion.id, {
          fecha: destino,
          horas: horasPropuestas,
        })

        const mensaje =
          horasPropuestas !== horasGestion
            ? `Gestión actualizada para ${nombreDia(destino)}, con ${formatoHoras(horasPropuestas)}`
            : `Gestión reprogramada para ${nombreDia(destino)}`

        avisar(mensaje)
      } else if (opcion === 'mover') {
        resultado = await reprogramarGestion(gestion.id, {
          fecha: diaLibre,
          horas: horasPropuestas,
        })

        avisar(
          `Gestión movida a ${nombreDia(diaLibre)} con ${formatoHoras(horasPropuestas)}`
        )
      } else if (opcion === 'reducir') {
        const nuevasHoras = Math.max(0.5, margen)

        resultado = await reprogramarGestion(gestion.id, {
          fecha: destino,
          horas: nuevasHoras,
        })

        avisar(
          `Gestión movida a ${nombreDia(destino)} con ${formatoHoras(nuevasHoras)}`
        )
      } else if (opcion === 'posponer') {
        await posponerGestion(candidata.id, sumarDias(destino, 1))

        resultado = await reprogramarGestion(gestion.id, {
          fecha: destino,
          horas: horasPropuestas,
        })

        avisar(
          `"${candidata.nombre}" pospuesta y gestión movida a ${nombreDia(destino)}`
        )
      } else {
        return
      }
      onReprogramada?.(resultado)
      onCerrar()
    } catch (error) {
      console.error('Error al reprogramar la gestión:', error)

      if (error.status === 409) {
        const conflicto = error.detalle?.error?.details
        const fechaConflicto = conflicto?.fecha || destino
        const horasConflicto = Number(conflicto?.horas)
        const limiteConflicto = Number(conflicto?.limite)
        const excesoConflicto = Number(conflicto?.exceso)

        if (
          Number.isFinite(horasConflicto) &&
          Number.isFinite(limiteConflicto) &&
          Number.isFinite(excesoConflicto)
        ) {
          avisar(
            `Sobrecarga el ${nombreDia(fechaConflicto)}: ${formatoHoras(
              horasConflicto
            )} planeadas, límite ${formatoHoras(
              limiteConflicto
            )}, exceso ${formatoHoras(excesoConflicto)}.`
          )
        } else {
          avisar(
            error.detalle?.error?.message ||
            'Ese día superaría tu límite de horas diario.'
          )
        }

        return
      }

      avisar('No se pudo reprogramar la gestión. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <dialog
      className="dialogo"
      ref={ref}
      onClose={onCerrar}
      aria-labelledby="dlg-titulo"
    >
      <div className="dialogo__header">
        <h2 className="dialogo__titulo" id="dlg-titulo">
          Reprogramar gestión
        </h2>
        <p className="dialogo__texto">{gestion.nombre}</p>
      </div>

      <div className="dialogo__cuerpo">
        <div className="campo">
          <label className="campo__label" htmlFor="destino">
            Nueva fecha
          </label>

          <input
            id="destino"
            type="date"
            min={hoyISO()}
            value={destino}
            onChange={(e) => {
              if (!e.target.value) return
              setDestino(e.target.value)
              setOpcion('')
            }}
          />
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="estimacion">
            Estimación de tiempo (horas)
          </label>

          <input
            id="estimacion"
            type="number"
            min="0.5"
            step="0.5"
            value={estimacion}
            onChange={(e) => {
              setEstimacion(e.target.value === '' ? '' : Number(e.target.value))
              setOpcion('')
            }}
            aria-describedby="estimacion-ayuda"
          />

          <p className="dialogo__texto" id="estimacion-ayuda">
            Puedes usar intervalos de media hora. Ejemplo: 0,5; 1; 1,5; 2.
          </p>
        </div>

        <div className="balance">
          <div className="balance__fila">
            <span>Ya planeado {nombreDia(destino)}</span>
            <span className="balance__valor">
              {formatoHoras(yaPlaneado)}
            </span>
          </div>

          <div className="balance__fila">
            <span>Esta gestión</span>
            <span className="balance__valor">
              +{estimacionValida ? formatoHoras(horasPropuestas) : '—'}
            </span>
          </div>

          <div className="balance__fila">
            <span>Total del día</span>
            <span
              className={
                'balance__valor ' +
                (excede
                  ? 'balance__valor--malo'
                  : 'balance__valor--bueno')
              }
            >
              {estimacionValida ? formatoHoras(total) : '—'} de{' '}
              {formatoHoras(limite)}
            </span>
          </div>
        </div>

        {excede && estimacionValida && (
          <>
            <div className="aviso aviso--error">
              <span className="aviso__titulo">
                Ese día quedaría sobrecargado
              </span>

              <p className="aviso__texto">
                Quedarías con {formatoHoras(total)} de gestión planificadas
                (límite {formatoHoras(limite)}) {nombreDia(destino)}. Elige cómo
                resolverlo:
              </p>
            </div>

            {opciones.length > 0 ? (
              <ul
                className="opciones"
                role="radiogroup"
                aria-label="Cómo resolver la sobrecarga"
              >
                {opciones.map((o) => (
                  <li key={o.valor}>
                    <label className="opcion">
                      <input
                        type="radio"
                        name="resolucion"
                        value={o.valor}
                        checked={opcion === o.valor}
                        onChange={() => setOpcion(o.valor)}
                      />

                      <span className="opcion__titulo">{o.titulo}</span>
                      <span className="opcion__detalle">{o.detalle}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="aviso__texto">
                No hay una opción automática disponible. Reduce la estimación
                o elige otra fecha.
              </p>
            )}
          </>
        )}
      </div>

      <div className="dialogo__pie">
        <button
          type="button"
          className="btn btn--fantasma"
          onClick={onCerrar}
        >
          Cancelar
        </button>


        <button
          type="button"
          className="btn"
          onClick={confirmar}
          disabled={
            guardando ||
            !estimacionValida ||
            (excede && (!opcion || !opciones.some((o) => o.valor === opcion))
            )
          }
        >
          {guardando
            ? 'Guardando...'
            : excede
              ? 'Aplicar y reprogramar'
              : 'Guardar cambios'}
        </button>

      </div>
    </dialog>
  )
}
