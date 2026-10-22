# Chronos — Planificador de eventos (Frontend)

Aplicación web para organizadores de eventos independientes: dividen cada evento en
gestiones logísticas con fecha y horas estimadas, ven qué atender hoy, reprograman
cuando hay sobrecarga y siguen el progreso de preparación.

- **App publicada:** https://planificador-eventos-fe.vercel.app
- **API (estado del backend):** https://planificador-eventos-be.onrender.com/api/health/
- **Documentación de la API (Swagger):** https://planificador-eventos-be.onrender.com/api/docs/
- **Repositorio del backend:** https://github.com/Univalle-PI2026-2-ED/planificador-eventos-BE

> El backend está en el plan gratuito de Render: si lleva rato sin uso, la primera
> petición puede tardar hasta 1 minuto en responder. Espera y vuelve a intentar.

## Cuenta de prueba
- Correo: `pollo123@gmail.com`
- Contraseña: `Felipe1707+`

La cuenta ya tiene eventos y gestiones cargados para probar. También puedes crear tu
propia cuenta en `/registro`.

## Cómo probar la aplicación
1. Entra a https://planificador-eventos-fe.vercel.app e inicia sesión con la cuenta
   de prueba.
2. **Hoy (`/hoy`):** revisa las gestiones agrupadas en *Vencidas*, *Para hoy* y
   *Próximas*, la regla "Así se ordena tu día" y la barra de carga del día frente a
   tu límite. Prueba los filtros (*Todas*, *Urgentes y vencidas*, *Pendientes*,
   *Hechas*) y el filtro por evento; "Quitar filtros" vuelve a mostrar todo.
3. **Crear evento (`/crear`):** crea un evento con al menos una gestión. Intenta
   guardarlo con campos vacíos u horas en 0 para ver los mensajes de validación.
4. **Configuración (`/configuracion`):** cambia tu límite diario de horas (entre 1
   y 16, en pasos de 0,5).
5. **Detalle del evento (`/evento/:id`):**
   - Marca gestiones como *hechas* o *pospuestas* y escribe una nota; recarga la
     página para comprobar que se guardaron.
   - Pulsa **Reprogramar** en una gestión y muévela a un día que ya tenga muchas
     horas. La app detecta la sobrecarga y ofrece moverla a otro día, reducir la
     estimación o posponerla.
6. **Editar (`/evento/:id/editar`):** cambia datos del evento, agrega o elimina
   gestiones (la eliminación pide confirmación).
7. **Progreso (`/progreso`):** comprueba que el porcentaje de cada evento refleja
   las gestiones hechas.
8. Pulsa **Cerrar sesión** e intenta entrar a `/hoy`: te redirige al login.

## Tecnologías
React 19, Vite, React Router, Oxlint. Desplegado en Vercel.

## Estructura
```
planificador-eventos-FE/
├── public/
│   ├── fonts/                     # Tipografía Alte Haas Grotesk
│   └── tabicon.svg                # Ícono de la pestaña
├── src/
│   ├── pages/                     # Pantallas (una por ruta)
│   │   ├── Login.jsx              # /login
│   │   ├── Registro.jsx           # /registro
│   │   ├── Hoy.jsx                # /hoy: vencidas, para hoy, próximas, filtros y carga del día
│   │   ├── Crear.jsx              # /crear: nuevo evento con su plan de gestiones
│   │   ├── Evento.jsx             # /evento/:id: detalle, estados, notas y reprogramar
│   │   ├── EditarEvento.jsx       # /evento/:id/editar
│   │   ├── Progreso.jsx           # /progreso: avance de cada evento
│   │   ├── Configuracion.jsx      # /configuracion: límite diario de horas
│   │   └── *.css                  # Estilos de cada pantalla
│   ├── components/                # Piezas reutilizables
│   │   ├── Layout.jsx             # Menú de navegación y cierre de sesión
│   │   ├── DialogoReprogramar.jsx # Conflicto de sobrecarga: mover, reducir o posponer
│   │   ├── ConfirmarEliminar.jsx  # Confirmación antes de eliminar
│   │   ├── SelectorEstados.jsx    # Pendiente / hecho / pospuesto
│   │   ├── SelectorFecha.jsx      # Selector de fecha
│   │   ├── SelectorHora.jsx       # Selector de hora
│   │   ├── InputClave.jsx         # Campo de contraseña con botón para mostrar/ocultar
│   │   └── *.css
│   ├── context/                   # Estado compartido
│   │   ├── contextos.js           # Definición de los contextos y sus hooks (useAuth, …)
│   │   ├── AuthContext.jsx        # Sesión del usuario y token
│   │   ├── EventosContext.jsx     # Eventos, gestiones y límite de horas
│   │   └── AvisosContext.jsx      # Mensajes de éxito y error
│   ├── lib/                       # Lógica sin interfaz
│   │   ├── api.js                 # Cliente HTTP hacia el backend
│   │   ├── sesion.js              # Guarda la sesión mientras la pestaña esté abierta
│   │   ├── fechas.js              # Utilidades de fechas
│   │   ├── prioridad.js           # Regla de orden de "Hoy"
│   │   └── useReloj.js            # Refresca la vista cada minuto para reclasificar vencidas
│   ├── App.jsx                    # Rutas y rutas protegidas
│   ├── main.jsx                   # Punto de entrada
│   ├── index.css                  # Estilos globales
│   └── tokens.css                 # Colores, tipografía y espaciados
├── index.html
├── vite.config.js
├── vercel.json                    # Redirige todas las rutas a index.html
├── .env.example                   # Plantilla de VITE_API_URL
├── .oxlintrc.json                 # Reglas de lint
├── package.json
└── package-lock.json
```

## Rutas
`/login`, `/registro`, `/hoy`, `/crear`, `/evento/:id`, `/evento/:id/editar`,
`/progreso`, `/configuracion`. Todas, salvo login y registro, requieren sesión.
La sesión se guarda solo mientras la pestaña esté abierta.

## Cómo correrlo en local
1. Instala Node.js 20.19 o superior (recomendado 22).
2. Clona el repositorio e instala dependencias:
```bash
   git clone https://github.com/Univalle-PI2026-2-ED/planificador-eventos-FE.git
   cd planificador-eventos-FE
   npm install
```
3. Copia `.env.example` a `.env.local` y elige a qué API apuntar:
```
   # Backend publicado en Render
   VITE_API_URL=https://planificador-eventos-be.onrender.com/api
   # o backend corriendo en local
   VITE_API_URL=http://localhost:8000/api
```
4. Arranca con `npm run dev` y abre http://localhost:5173

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción (`dist/`) |
| `npm run preview` | Sirve la compilación localmente |
| `npm run lint` | Revisa el código con Oxlint |

## Despliegue
El front se despliega en Vercel desde la rama `main`. La variable `VITE_API_URL`
(`https://planificador-eventos-be.onrender.com/api`) se define en el proyecto de
Vercel (*Settings → Environment Variables*); si se cambia, hay que redesplegar.
`vercel.json` redirige todas las rutas a `index.html` para que funcione recargar
en cualquier pantalla.

## Equipo
- Daniel Andrés Micolta Góngora
- Thomas Herrera Parra
- Yoel Steven Montoya Hernández
- Andrés Felipe Muñoz Castro
