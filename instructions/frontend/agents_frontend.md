# AGENTE DE GENERACIÓN – FRONTEND REACT (MÓDULO `/frontend`)

Tu tarea es mantener y evolucionar el módulo de frontend ubicado en `/frontend`, construido con React, Tailwind CSS, Flowbite y desplegado mediante GitHub Pages. El flujo de trabajo y los requisitos funcionales se heredan del repositorio original.

Desarrolla el proyecto completo con todos sus archivos, carpetas y configuraciones necesarias dentro de `/frontend`. No omitas nada. El resultado debe estar listo para clonar, ejecutar y desplegar desde la raíz del monorepo.

---

## INSTRUCCIONES DE DESARROLLO

1. Crea o ajusta la aplicación React moderna usando Vite y JavaScript bajo `/frontend`.
2. Configura Tailwind CSS completamente integrado.
3. Instala y configura Flowbite y Flowbite React para los componentes UI.
4. Usa npm como gestor de paquetes (los comandos se ejecutan desde la raíz del repositorio).
5. Implementa React Router DOM versión 6 para la navegación.
6. **Nunca hardcodees la URL del backend**: todas las llamadas deben apoyarse en `import.meta.env.VITE_API_BASE_URL` resuelta por `src/utils/apiBase.js`.
7. Mantén el cliente `fetch` de `src/lib/apiClient.js` con solicitudes CORS configuradas (`mode: 'cors'` en llamadas de origen cruzado) y habilita `credentials: 'include'` únicamente cuando el módulo que realiza la petición lo solicite mediante `withCredentials: true` o `credentials: 'include'`.
8. Configura los clientes de Axios en `src/services/api.js` para que solo envíen `withCredentials: true` cuando cada llamada lo pida explícitamente; las peticiones deben omitir credenciales de origen cruzado por defecto.

---

## ESTRUCTURA Y FUNCIONALIDAD

- La página principal debe listar todas las entradas del blog.
- Cada entrada debe tener un título, resumen y enlace a su post individual.
- Cada post debe mostrar su contenido completo y comentarios asociados.
- Los comentarios y posts deben estar en archivos JSON locales en la carpeta `/frontend/src/data`.
- Implementa un componente Navbar con Flowbite React, responsivo y simple.
- El diseño debe ser limpio, moderno y responsivo.
- El módulo consume la API REST mediante el helper `src/utils/apiBase.js`, que normaliza `VITE_API_BASE_URL` y define fallbacks controlados. Está prohibido reemplazarlo por strings directas.

---

## REQUISITOS DE CONFIGURACIÓN

### Tailwind
- Añade rutas de contenido incluyendo `../node_modules/flowbite/**/*.js` y `../node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}` desde `/frontend/tailwind.config.js`.
- Incluye el plugin de Flowbite en la configuración (`/frontend/tailwind.config.js`).
- Habilita estilos base, componentes y utilidades.

### Vite
- Configura el plugin de React en `/frontend/vite.config.js`.
- Define la propiedad base para GitHub Pages, usando el nombre del repositorio.
- Asegúrate de que `BrowserRouter` use `basename` con `import.meta.env.BASE_URL` en `/frontend/src/main.jsx`.

### GitHub Actions
- El workflow en `.github/workflows/deploy.yml` permanece intacto. Debe:
  1. Ejecutarse en cada push a `main`.
  2. Instalar dependencias con `npm ci` (desde la raíz del monorepo).
  3. Compilar el proyecto con `npm run build` (usa la configuración en `/frontend`).
  4. Desplegar el contenido de `dist/` (generado en la raíz) a la rama `gh-pages` usando `JamesIves/github-pages-deploy-action@v4`.
  5. Utilizar el token `GITHUB_TOKEN` y permisos `contents: write`.

---

## ESTRUCTURA DEL MÓDULO FRONTEND

- El `package.json` en la raíz expone los scripts `dev`, `build` y `preview`, los cuales ejecutan Vite con la configuración situada en `/frontend`.
- `/frontend/vite.config.js` configurado con `base`, plugin React y salida a `../dist` para conservar la compatibilidad con GitHub Pages.
- `/frontend/tailwind.config.js` y `/frontend/postcss.config.js` correctamente configurados.
- `/frontend/index.html` con un `div#root` y enlace al script principal.
- `/frontend/src/` con:
  - `index.css` con Tailwind y Flowbite importados.
  - `main.jsx` que monta `App` y configura `BrowserRouter`.
  - `App.jsx` con configuración de rutas.
  - `components/NavBar.jsx` con Flowbite.
  - `pages/Home.jsx` para listado de posts.
  - `pages/Post.jsx` para detalle y comentarios.
  - `data/posts.json` y `data/comments.json` con contenido de ejemplo.
- `.gitignore` en la raíz ignorando `node_modules/` y `dist/`.
- `.github/workflows/deploy.yml` configurado (no modificar a menos que se documente un cambio aprobado).
- `/frontend/README.md` explicando stack, ejecución local, build y despliegue automático.

---

## REGLAS DE DESARROLLO

- Todo en JavaScript, sin TypeScript.
- Código limpio, comentado y modular.
- Interfaz en español.
- Todo debe funcionar con:
  - `npm install`
  - `npm run dev`
  - `npm run build`
- El despliegue debe ocurrir automáticamente al hacer push en `main`.
- Usa clases de Tailwind y componentes de Flowbite React para toda la UI.
- `/frontend/README.md` debe incluir pasos de instalación, ejecución, build y deploy.

---

## RESULTADO ESPERADO

Un módulo de frontend funcional y completo que, tras clonar el repositorio y ejecutar los comandos desde la raíz, pueda ejecutarse localmente y desplegarse automáticamente en GitHub Pages.

**Idioma del proyecto:** Español  
**Gestor de paquetes:** npm  
**Framework:** React + Vite  
**Estilos:** Tailwind CSS + Flowbite  
**CI/CD:** GitHub Actions → GitHub Pages  
**Repositorio:** `react-tailwind-blog`
