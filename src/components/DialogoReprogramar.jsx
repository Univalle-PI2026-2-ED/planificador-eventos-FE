import { useEffect, useRef, useState } from 'react'
import { useEventos } from '../context/EventosContext.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { formatoHoras, hoyISO, mayuscula, nombreDia, sumarDias } from '../lib/fechas.js'

// T3: reprogramar una gestión y resolver el conflicto por sobrecarga diaria.
// El conflicto ocurre cuando las horas acumuladas del día destino superan el
// límite que definió la persona usuaria.
export default function DialogoReprogramar({ gestion, onCerrar }) {
  const ref = useRef(null)
  const { limiteHoras, horasDelDia, gestionesDelDia, reprogramarGestion, posponerGestion } = useEventos()
  const { avisar } = useAvisos()
  const [destino, setDestino] = useState(sumarDias(hoyISO(), 1))
  const [opcion, setOpcion] = useState('')

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (gestion) {
      setDestino(sumarDias(gestion.fecha, 1))
      setOpcion('')
      if (!dlg.open) dlg.showModal()
    } else if (dlg.open) {
      dlg.close()
    }
  }, [gestion])

  if (!gestion) return <dialog className="dialogo" ref={ref} onClose={onCerrar} />

  const dias = Array.from({ length: 5 }, (_, i) => sumarDias(hoyISO(), i + 1))
  const libres = (iso) => horasDelDia(iso, gestion.id)

  const yaPlaneado = libres(destino)
  const total = yaPlaneado + gestion.horas
  const excede = total > limiteHoras
  const margen = Math.max(0, limiteHoras - yaPlaneado)
  const diaLibre = dias.find((d) => libres(d) + gestion.horas <= limiteHoras)
  const candidata = gestionesDelDia(destino)
    .filter((g) => g.estado !== 'hecho' && g.id !== gestion.id)
    .sort((a, b) => b.horas - a.horas)[0]

  const opciones = []
  if (diaLibre) {
    opciones.push({
      valor: 'mover',
      titulo: `Llevarla a ${nombreDia(diaLibre)}`,
      detalle: `Ese día quedaría en ${formatoHoras(libres(diaLibre) + gestion.horas)}, dentro de tu límite.`,
    })
  }
  if (margen >= 0.5) {
    opciones.push({
      valor: 'reducir',
      titulo: `Reducir la estimación a ${formatoHoras(margen)}`,
      detalle: `Tu día ${nombreDia(destino)} queda justo en el límite de ${formatoHoras(limiteHoras)}.`,
    })
  }
  if (candidata) {
    opciones.push({
      valor: 'posponer',
      titulo: `Posponer “${candidata.nombre}”`,
      detalle: `Libera ${formatoHoras(candidata.horas)} de ${nombreDia(destino)} y esa gestión queda marcada como pospuesta.`,
    })
  }

  function confirmar() {
    if (!excede) {
      reprogramarGestion(gestion.id, { fecha: destino })
      avisar(`Gestión movida a ${nombreDia(destino)}`)
    } else if (opcion === 'mover') {
      reprogramarGestion(gestion.id, { fecha: diaLibre })
      avisar(`Gestión movida a ${nombreDia(diaLibre)}`)
    } else if (opcion === 'reducir') {
      reprogramarGestion(gestion.id, { fecha: destino, horas: Math.max(0.5, margen) })
      avisar(`Gestión movida a ${nombreDia(destino)} con ${formatoHoras(Math.max(0.5, margen))}`)
    } else if (opcion === 'posponer') {
      posponerGestion(candidata.id, sumarDias(destino, 1))
      reprogramarGestion(gestion.id, { fecha: destino })
      avisar(`“${candidata.nombre}” pospuesta y gestión movida a ${nombreDia(destino)}`)
    }
    onCerrar()
  }

  return (
    <dialog className="dialogo" ref={ref} onClose={onCerrar} aria-labelledby="dlg-titulo">
      <div className="dialogo__header">
        <h2 className="dialogo__titulo" id="dlg-titulo">Reprogramar gestión</h2>
        <p className="dialogo__texto">{gestion.nombre} · {formatoHoras(gestion.horas)}</p>
      </div>

      <div className="dialogo__cuerpo">
        <div className="campo">
          <label className="campo__label" htmlFor="destino">Nuevo día</label>
          <select id="destino" value={destino} onChange={(e) => { setDestino(e.target.value); setOpcion('') }}>
            {dias.map((d) => (
              <option key={d} value={d}>
                {nombreDia(d)} — {formatoHoras(libres(d))} ya planeadas
              </option>
            ))}
          </select>
        </div>

        <div className="balance">
          <div className="balance__fila">
            <span>Ya planeado {nombreDia(destino)}</span>
            <span className="balance__valor">{formatoHoras(yaPlaneado)}</span>
          </div>
          <div className="balance__fila">
            <span>Esta gestión</span>
            <span className="balance__valor">+{formatoHoras(gestion.horas)}</span>
          </div>
          <div className="balance__fila">
            <span>Total del día</span>
            <span className={'balance__valor ' + (excede ? 'balance__valor--malo' : 'balance__valor--bueno')}>
              {formatoHoras(total)} de {formatoHoras(limiteHoras)}
            </span>
          </div>
        </div>

        {excede && (
          <>
            <div className="aviso aviso--error">
              <span className="aviso__titulo">Ese día quedaría sobrecargado</span>
              <p className="aviso__texto">
                {mayuscula(nombreDia(destino))} acumularía {formatoHoras(total)} de gestión y tu
                límite es {formatoHoras(limiteHoras)} al día. Elige cómo resolverlo:
              </p>
            </div>

            <ul className="opciones" role="radiogroup" aria-label="Cómo resolver la sobrecarga">
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
          </>
        )}
      </div>

      <div className="dialogo__pie">
        <button type="button" className="btn btn--fantasma" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="btn" onClick={confirmar} disabled={excede && !opcion}>
          {excede ? 'Aplicar y reprogramar' : 'Reprogramar'}
        </button>
      </div>
    </dialog>
  )
}
