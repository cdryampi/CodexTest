# Frontend – Buenas prácticas y guía operativa

> Complementa este documento con la guía para agentes en `../../instructions/frontend/agents_frontend.md` y la bitácora activa en `../../instructions/frontend`. Ambas fuentes definen el alcance funcional del módulo React.

## Tabla de contenidos
- [Resumen](#resumen)
- [Arquitectura de la app](#arquitectura-de-la-app)
- [Stack técnico](#stack-técnico)
- [Estructura recomendada](#estructura-recomendada)
- [Estándares de desarrollo](#estándares-de-desarrollo)
  - [Convenciones de código](#convenciones-de-código)
  - [Gestión de estado y datos](#gestión-de-estado-y-datos)
  - [Ruteo y navegación](#ruteo-y-navegación)
  - [Estilos y componentes UI](#estilos-y-componentes-ui)
  - [Internacionalización y contenido](#internacionalización-y-contenido)
  - [Accesibilidad](#accesibilidad)
  - [Performance](#performance)
- [Pruebas y verificación](#pruebas-y-verificación)
- [Datos estáticos y seeds](#datos-estáticos-y-seeds)
- [Automatización y CI/CD](#automatización-y-cicd)
- [Deploy en GitHub Pages](#deploy-en-github-pages)
- [Troubleshooting](#troubleshooting)
- [Versionado y documentación](#versionado-y-documentación)
- [Recursos útiles](#recursos-útiles)

## Resumen
El frontend de **CodexTest** es una aplicación **React 18** montada con **Vite** y estilizada mediante **Tailwind CSS** más **Flowbite React**. Se entrega como SPA estática desplegada en **GitHub Pages** desde el directorio `/frontend` y consumiendo datos locales (`/frontend/src/data`). Este documento compila las buenas prácticas para mantener el código consistente, accesible y alineado con el pipeline automatizado.

## Arquitectura de la app
```
[Vite + React] → Router (BrowserRouter basename=import.meta.env.BASE_URL)
            │
            ├─ Componentes de página (`/frontend/src/pages`)
            ├─ Componentes reutilizables (`/frontend/src/components`)
            ├─ Hooks utilitarios (`/frontend/src/hooks` opcional)
            ├─ Datos estáticos (`/frontend/src/data/*.json`)
            ├─ Estilos globales (`/frontend/src/index.css`)
            └─ Servicios helper (`/frontend/src/lib` opcional)
```
Aspectos clave:
- **SPA estática**: no existe backend en producción; toda la data proviene de JSON locales.
- **Router DOM v6**: las rutas deben usar `BrowserRouter` con `basename={import.meta.env.BASE_URL}` para compatibilidad con GitHub Pages.
- **Salida build**: Vite genera artefactos en `../dist` (desde `/frontend`), requisito del workflow actual.
- **Tailwind + Flowbite**: las clases utilitarias se combinan con componentes Flowbite React para mantener consistencia visual.

## Stack técnico
| Capa | Tecnología | Notas |
| --- | --- | --- |
| Bundler | Vite 4 | Configurado en `/frontend/vite.config.js` con plugin `@vitejs/plugin-react` y `base` para GitHub Pages. |
| Framework | React 18 | Componentes funcionales con hooks; evita clases. |
| UI | Tailwind CSS 3 + Flowbite React | Incluir plugin `flowbite` en `tailwind.config.js` y estilos en `index.css`. |
| Routing | React Router DOM 6 | Definir rutas declarativas en `App.jsx`. |
| State | Hooks nativos (`useState`, `useMemo`, `useEffect`) | Para casos complejos evaluar Context API. |
| Linting | ESLint + Prettier (pendiente) | Recomendada configuración shareable en futuras tareas. |

## Estructura recomendada
Mantén la estructura base propuesta en las instrucciones del módulo:
```
/frontend
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components
    │   └── NavBar.jsx
    ├── pages
    │   ├── Home.jsx
    │   └── Post.jsx
    └── data
        ├── posts.json
        └── comments.json
```
Puedes añadir directorios específicos (`hooks`, `lib`, `layouts`, `assets`) siempre que actualices esta guía y el README del módulo.

## Estándares de desarrollo
### Convenciones de código
- Usa **funciones flecha** y componentes funcionales.
- Tipifica props con `PropTypes` cuando el componente sea público o reutilizable.
- Nombra archivos con `PascalCase` para componentes y `camelCase` para utilidades.
- Mantén los imports ordenados: librerías externas, aliases absolutos, relativos.
- Los efectos (`useEffect`) deben limpiar recursos cuando corresponda.
- Evita lógica de negocio en JSX; extrae helpers a funciones puras.

### Gestión de estado y datos
- Prefiere **estado local** con `useState` y **memoización** con `useMemo`/`useCallback`.
- Usa **Context API** para cross-cutting concerns (tema, usuario, configuración).
- Si se requiere sincronizar datos remotos en el futuro, encapsula fetchers en `/frontend/src/lib/api.js` para facilitar pruebas.
- Mantén los JSON de `data/` normalizados (IDs numéricos, slugs string, arrays de comentarios). Documenta el esquema en este archivo.

### Ruteo y navegación
- Define rutas en `App.jsx` usando `createBrowserRouter` o `<Routes>` según convenga.
- Habilita **rutas anidadas** para secciones complejas y componentes de layout compartidos.
- Implementa un **fallback 404** (`<NotFound />`) y rutas con loaders cuando se integren datos dinámicos.
- Para enlaces internos utiliza `<Link>` de React Router; para externos `<a>` con `rel="noreferrer" target="_blank"` cuando aplique.

### Estilos y componentes UI
- Usa Tailwind para spacing, tipografía, colores. Mantén tokens personalizados en `tailwind.config.js` (paleta extendida, fuentes, breakpoints).
- Componentes Flowbite React deben envolverse en contenedores responsivos (`max-w-*`, `mx-auto`).
- Extrae variantes UI repetitivas a componentes dedicados (por ejemplo, `Button`, `Card`, `Tag`).
- Importa los estilos base en `index.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  @import "flowbite";
  ```
- Usa `clsx` o utilidades similares para combinar clases condicionales.

### Internacionalización y contenido
- Mantén la interfaz y contenido en **español neutro**.
- Centraliza strings largos en objetos (`/frontend/src/constants/copy.js`) para facilitar futuras traducciones.
- Evita hardcodear fechas; usa helpers que formateen según la localización (`Intl.DateTimeFormat` con `es-ES`).

### Accesibilidad
- Aplica roles y atributos ARIA cuando Flowbite no los provea por defecto.
- Asegura contraste AA mínimo para textos (usa `text-slate-900` sobre fondos claros, `text-white` sobre primarios).
- Habilita navegación por teclado: componentes interactivos deben ser focusables (`tabIndex`, `role="button"` si procede).
- Añade etiquetas `alt` descriptivas a imágenes y `aria-label` en iconos.

### Performance
- Divide el bundle por rutas con `React.lazy` y `Suspense` si el tamaño supera 200 KB.
- Usa `useMemo`/`useCallback` para evitar renders costosos en listas grandes.
- Aprovecha `vite.config.js` para definir imports automáticos (`optimizeDeps.include`) cuando sea necesario.
- Activa `npm run build -- --report` para auditar tamaños cuando se modifiquen dependencias pesadas.

## Pruebas y verificación
- Ejecuta `npm run lint` (cuando se configure) y `npm run test` para suites unitarias.
- Usa **Vitest** + **React Testing Library** para componentes críticos (navbar, páginas principales).
- Añade pruebas de accesibilidad con `@testing-library/jest-dom` y `axe-core` en modo opcional.
- Documenta en Pull Requests los comandos ejecutados y adjunta capturas cuando la UI cambie.

## Datos estáticos y seeds
- `posts.json` y `comments.json` deben mantenerse sincronizados mediante claves (`postId` o `slug`).
- Incluye campos mínimos:
  ```json
  {
    "id": 1,
    "slug": "introduccion-tailwind",
    "title": "Introducción a Tailwind CSS",
    "excerpt": "Cómo integrar utilidades de Tailwind en Vite...",
    "content": "El contenido debe superar las 200 palabras para SEO.",
    "tags": ["tailwind", "frontend"],
    "publishedAt": "2024-02-10"
  }
  ```
- Los comentarios referencian el post por `postId` o `postSlug` y ordenan por fecha descendente.
- Cuando se actualicen seeds, registra el cambio en la sección [Versionado y documentación](#versionado-y-documentación).

## Automatización y CI/CD
- El pipeline GitHub Actions (`.github/workflows/deploy.yml`) ejecuta:
  1. `npm ci`
  2. `npm run build`
  3. Deploy con `JamesIves/github-pages-deploy-action@v4`
- Mantén la salida de build en `dist/` raíz. Cambios en la ruta requieren actualizar el workflow.
- Revisa que `vite.config.js` exporte `base: '/CodexTest/'` (o el repo actual) para evitar paths rotos en GitHub Pages.
- Usa `npm run preview` para validar el build estático antes de hacer push.

## Deploy en GitHub Pages
- La rama `gh-pages` se sobreescribe en cada deploy automático.
- El contenido estático se publica en `https://<usuario>.github.io/CodexTest/`.
- Configuración crítica:
  - `BrowserRouter` con `basename={import.meta.env.BASE_URL}`.
  - Assets referenciados mediante rutas relativas (`/assets/...` generadas por Vite ya incluyen hash).
  - Meta tags base en `index.html` (charset, viewport, manifest opcional).
- Para ambientes locales con rutas anidadas, ejecuta `npm run dev` y verifica en `http://localhost:5173/CodexTest/` si se usa `base` personalizada.

## Troubleshooting
| Problema | Síntoma | Solución |
| --- | --- | --- |
| Ruta rota tras deploy | Navegación 404 en GitHub Pages | Confirmar `base` en Vite y `basename` en router. Ejecutar `npm run build` local y revisar `dist/index.html`. |
| Estilos de Flowbite ausentes | Componentes sin estilos | Verificar import `import 'flowbite';` en `main.jsx` o `index.css` y contenido de `tailwind.config.js`. |
| Contenido no actualiza | Cambios en JSON no reflejados | Asegurar invalidación de cache (query param o limpiar localStorage). En desarrollo reiniciar Vite. |
| Layout rompe en móviles | Overflow horizontal | Revisar clases responsive (`px-4`, `max-w-full`) y evita tamaños fijos superiores a `w-full`. |
| Error en build | `Cannot find module` | Checar rutas relativas y extensiones `.jsx`. Ejecutar `npm install` para restaurar dependencias. |

## Versionado y documentación
- Mantén este documento actualizado cuando se agreguen rutas, componentes clave o flujos críticos.
- Resume breaking changes en un changelog dentro de esta sección o enlaza a `docs/CHANGELOG.md` si se crea.
- Cada Pull Request debe referenciar secciones actualizadas y adjuntar capturas cuando aplique.
- El README del módulo (`/frontend/README.md`) debe enlazar este archivo para ofrecer visión detallada.

## Recursos útiles
- [Documentación de Vite](https://vitejs.dev/guide/)
- [React Router v6 – Guía](https://reactrouter.com/en/main)
- [Tailwind CSS – Componentes](https://tailwindcss.com/docs/utility-first)
- [Flowbite React](https://flowbite-react.com/)
- [Guías de accesibilidad WAI](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [MDN – Formateo de fechas con Intl](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
