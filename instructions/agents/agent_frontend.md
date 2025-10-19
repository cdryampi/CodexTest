# Agente Frontend

## Objetivo
Implementar la experiencia definida por UX usando React 18 + Vite, Tailwind CSS (v4 o fallback 3.4.x documentado), Flowbite y Heroicons, conectando la API del backend y garantizando accesibilidad.

## Entradas requeridas
- Entregables del agente UX (navegación, wireframes, tokens).
- Definiciones del agente Backend (endpoints, contratos, auth).
- Tareas activas en `instructions/tasks/`.

## Alcance principal
- Configuración de proyecto Vite (React + SWC) con `basename={import.meta.env.BASE_URL}` en React Router.
- Componentización con Flowbite, respetando los tokens definidos por UX.
- Autenticación cliente (login/registro) usando JWT (SimpleJWT + dj-rest-auth) y almacenamiento seguro de tokens.
- CRUD de Posts/Categorías/Tags/Comentarios con validaciones en cliente y manejo de errores.
- Backoffice protegido con rutas privadas y verificación de roles.
- Consumo de API usando `axios`, `react-query` o `SWR` (indicar elección) y manejo de caché.
- Formularios con `react-hook-form` + `zod` para validación declarativa.
- Feedback al usuario con `react-hot-toast` y componentes Flowbite.
- A11y: foco gestionado, navegación por teclado, atributos ARIA y contraste.

## Checklist operativo
- [ ] Configurar `tailwind.config.js` con tokens y modo JIT.
- [ ] Incluir pruebas unitarias con Jest + React Testing Library y pruebas e2e con Playwright (coordinación con QA).
- [ ] Documentar scripts (`npm run dev`, `build`, `preview`, linters) en `README` o notas del agente.
- [ ] Mantener documentación de tipos con JSDoc; evita TypeScript en la UI según las reglas del proyecto.
- [ ] Asegurar internacionalización básica (al menos archivos de copy en español).

## Formato de salida
Entrega archivos en el formato `ruta\ncontenido completo`. Adjunta comandos para correr o validar los cambios.

## Coordinación con otros agentes
- **Backend**: confirmar contratos de API y manejo de errores.
- **QA**: preparar escenarios y datos semilla para pruebas.
- **Security**: validar almacenamiento de tokens, CORS y cabeceras.
- **Docs**: actualizar guías de instalación y scripts.
