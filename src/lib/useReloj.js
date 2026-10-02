import { useEffect, useState } from 'react'

// Fuerza un nuevo render al comenzar cada minuto (y al volver a la pestaña),
// para que lo que depende de la hora actual no quede desactualizado.
export function useReloj() {
  const [, setTick] = useState(0)

  useEffect(() => {
    let temporizador
    const refrescar = () => setTick((t) => t + 1)

    const programar = () => {
      const msHastaElSiguienteMinuto = 60000 - (Date.now() % 60000)
      temporizador = setTimeout(() => {
        refrescar()
        programar()
      }, msHastaElSiguienteMinuto + 50)
    }

    const alVolver = () => {
      if (!document.hidden) refrescar()
    }

    programar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearTimeout(temporizador)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])
}