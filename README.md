# Chronos — Planificador de eventos (Frontend)

Aplicación web para organizadores de eventos independientes: dividen cada evento en
gestiones logísticas con fecha y horas estimadas, ven qué atender hoy, reprograman
cuando hay sobrecarga y siguen el progreso de preparación.

- **App publicada:** https://planificador-eventos-fe.vercel.app
- **API (backend):** https://planificador-eventos-be.onrender.com/api
- **Documentación de la API (Swagger):** https://planificador-eventos-be.onrender.com/api/docs/

> El backend está en el plan gratuito de Render: si lleva rato sin uso, la primera
> petición puede tardar hasta 1 minuto en responder. Espera y vuelve a intentar.

## Cuenta de prueba
- Correo: `[correo-demo]`
- Contraseña: `[contraseña-demo]`

(También puedes crear tu propia cuenta en `/registro`.)

## Tecnologías
React 19, Vite, React Router, Oxlint.

## Cómo correrlo en local
1. Instala Node.js 20 o superior.
2. Instala dependencias: `npm install`
3. Copia `.env.example` a `.env.local` y revisa la URL de la API:
```
   VITE_API_URL=http://localhost:8000/api
```
   (o usa la URL de Render para apuntar al backend publicado).
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
