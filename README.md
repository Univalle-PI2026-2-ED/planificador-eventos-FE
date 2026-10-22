# Chronos — Planificador de eventos (Frontend)

Aplicación web para organizadores de eventos independientes: dividen cada evento en
gestiones logísticas con fecha y horas estimadas, ven qué atender hoy, reprograman
cuando hay sobrecarga y siguen el progreso de preparación.

- **App publicada:** https://planificador-eventos-fe.vercel.app
- **API (estado del backend):** https://planificador-eventos-be.onrender.com/api/health/
- **Documentación de la API (Swagger):** https://planificador-eventos-be.onrender.com/api/docs/
- **Repositorio del backend:** [link-al-repo-backend]

> El backend está en el plan gratuito de Render: si lleva rato sin uso, la primera
> petición puede tardar hasta 1 minuto en responder. Espera y vuelve a intentar.

## Cuenta de prueba
- Correo: `[correo-demo]`
- Contraseña: `[contraseña-demo]`

La cuenta ya tiene eventos y gestiones cargados para probar. También puedes crear tu
propia cuenta en `/registro`.

## Cómo probar la aplicación
1. Entra a la app e inicia sesión con la cuenta de prueba.
2. **Hoy (`/hoy`):** revisa las gestiones agrupadas en *Vencidas*, *Para hoy* y
   *Próximas*. Prueba los filtros por evento y por estado.
3. **Crear evento (`/crear`):** crea un evento con al menos una gestión. Intenta
   guardarlo con campos vacíos u horas en 0 para ver los mensajes de validación.
4. **Configuración (`/configuracion`):** cambia tu límite diario de horas (1 a 16).
5. **Reprogramar:** mueve una gestión a un día que ya tenga muchas horas
   planificadas. La app avisa del conflicto de sobrecarga y ofrece moverla a otro
   día, reducir horas o posponerla.
6. **Registrar avance:** marca gestiones como *hechas* o *pospuestas* (con nota).
7. **Progreso (`/progreso`):** comprueba que el porcentaje de cada evento refleja
   las gestiones hechas.
8. Cierra sesión e intenta entrar a `/hoy`: te redirige al login.

## Tecnologías
React 19, Vite, React Router, Oxlint.

## Cómo correrlo en local
1. Instala Node.js 20 o superior.
2. Instala dependencias: `npm install`
3. Copia `.env.example` a `.env.local` y revisa la URL de la API:
```
   VITE_API_URL=http://localhost:8000/api
```
   (o usa `https://planificador-eventos-be.onrender.com/api` para apuntar al
   backend publicado).
4. Arranca: `npm run dev` y abre http://localhost:5173

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción (`dist/`) |
| `npm run preview` | Sirve la compilación localmente |
| `npm run lint` | Revisa el código con Oxlint |

## Rutas
`/login`, `/registro`, `/hoy`, `/crear`, `/evento/:id`, `/evento/:id/editar`,
`/progreso`, `/configuracion`. Todas, salvo login y registro, requieren sesión.

## Despliegue
El front se despliega en Vercel. Define la variable `VITE_API_URL` en el proyecto de
Vercel (*Settings → Environment Variables*) y redespliega cuando la cambies.
`vercel.json` redirige todas las rutas a `index.html` para que funcione recargar
en cualquier pantalla.

## Equipo
- Daniel Andrés Micolta Góngora
- Thomas Herrera Parra
- Yoel Steven Montoya Hernández
- Andrés Felipe Muñoz Castro
