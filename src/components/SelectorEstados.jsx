// Conmutador de estados de pantalla.
//
// Para qué sirve: la vista "Hoy" tiene cuatro estados (con datos, vacío,
// cargando y error) y hay que mostrarlos como evidencia del sprint. Sin esto
// tocaría borrar eventos a mano o desconectar el backend para poder capturar
// cada uno. Con esto se cambian con un clic.
//
// Cuando la API sea real, el estado sale de la respuesta del servidor y este
// componente se puede borrar. Mientras tanto:
//   - MOSTRAR = true  -> visible también en el despliegue (útil para que lo
//     revisen desde la URL de Vercel).
//   - MOSTRAR = import.meta.env.DEV -> solo visible en `npm run dev`.
const MOSTRAR = true

const ESTADOS = [
  { valor: 'auto', texto: 'Con datos' },
  { valor: 'vacio', texto: 'Vacío' },
  { valor: 'cargando', texto: 'Cargando' },
  { valor: 'error', texto: 'Error' },
]

export default function SelectorEstados({ valor, onCambiar }) {
  if (!MOSTRAR) return null

  return (
    <aside className="demo">
      <p className="demo__titulo" id="demo-titulo">Ver estado de la pantalla</p>

      <div className="demo__grupo" role="group" aria-labelledby="demo-titulo">
        {ESTADOS.map((e) => (
          <button
            key={e.valor}
            type="button"
            className="demo__btn"
            aria-pressed={valor === e.valor}
            onClick={() => onCambiar(e.valor)}
          >
            {e.texto}
          </button>
        ))}
      </div>

      <p className="demo__nota">
        Solo para capturar evidencia. No cambia tus datos: vuelve a “Con datos” para seguir usando la app.
      </p>
    </aside>
  )
}
