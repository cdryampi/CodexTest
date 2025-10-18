# React Tailwind Blog

Este módulo vive dentro de `/frontend` del monorepo y contiene el cliente React desplegado en GitHub Pages. Ahora consume la API pública disponible en `https://backendblog.yampi.eu/` para obtener posts y comentarios reales a través de Django REST Framework.

## Stack principal

- **Vite + React 18** para el renderizado SPA.
- **Tailwind CSS** y **Flowbite React** para los estilos y componentes accesibles.
- **React Router DOM v6** con rutas `/` (home), `/post/:slug` (detalle) y un fallback `404`.
- **Zustand** para la gestión de tema, filtros, búsqueda y paginación con persistencia en `localStorage`.
- **Fetch wrapper personalizado** en `src/lib/apiClient.js` con `AbortController`, timeout manual, normalización de errores y _retry_ explícito desde la UI.

## Configuración de API

La URL base actual se define como constante en `src/lib/apiClient.js`:

```js
const API_BASE_URL = 'https://backendblog.yampi.eu';
// TODO: parametrizar con window.__ENV__?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '/api/'
```

> ⚠️ Próximo paso: reemplazar la constante por las variables de entorno mencionadas en el comentario para soportar despliegues multi-entorno.

### Endpoints consumidos

- `GET /api/posts/?page=&search=&ordering=&tags=`
- `GET /api/posts/{slug}/`
- `GET /api/posts/{slug}/comments/`
- `POST /api/posts/{slug}/comments/`

El wrapper `src/lib/api.js` centraliza las funciones de dominio (`listPosts`, `getPost`, `listComments`, `createComment`) y sanitiza la entrada del cliente.

## Estado global y UX

- `src/store/useUI.js` expone un store de Zustand con:
  - `theme` (`light` | `dark`) persistente.
  - `search`, `ordering`, `selectedTags`, `page` sincronizados con la UI.
  - Acciones para cambiar filtros, reiniciarlos y paginar.
- El tema se aplica sobre `document.documentElement` y se recuerda entre sesiones.
- La búsqueda en la `Navbar` usa _debounce_ de 300 ms y se sincroniza con la home.
- Tag filter con etiquetas disponibles en el backend (`ciencia`, `devops`, `django`, `docker`, `filosofia`, `react`, `tutorial`).
- Toaster accesible para confirmar la publicación de comentarios o mostrar errores.
- Estados de _loading_, _empty_ y _error_ con componentes dedicados (`Skeleton`, `PostList`, `CommentsSection`).

## Instalación

Desde la raíz del monorepo:

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Vite levantará el proyecto en `http://localhost:5173/` (o el puerto disponible). El `BrowserRouter` usa `basename={import.meta.env.BASE_URL}` para mantener compatibilidad con GitHub Pages.

## Compilar y previsualizar

```bash
npm run build
npm run preview
```

La salida de la build queda en `dist/` (en la raíz del repositorio) para ser publicada automáticamente por GitHub Actions.

## Despliegue automático

El workflow `.github/workflows/deploy.yml` continúa desplegando en GitHub Pages cuando se hace push a `main`:

1. Ejecuta `npm ci` desde la raíz.
2. Compila con `npm run build` usando la configuración de Vite en `/frontend`.
3. Publica `dist/` en la rama `gh-pages` mediante `JamesIves/github-pages-deploy-action@v4`.

## Páginas y componentes clave

| Ruta / Archivo | Descripción |
| --- | --- |
| `src/App.jsx` | Rutas y layout principal. |
| `src/main.jsx` | Montaje de React + Flowbite e importación del store para aplicar el tema al cargar. |
| `src/pages/Home.jsx` | Lista paginada de posts con filtros, ordenamientos y estados de red. |
| `src/pages/PostDetail.jsx` | Detalle del post, renderizado del contenido, manejo de 404 y comentarios anidados. |
| `src/components/PostList.jsx` | Renderiza tarjetas o estados de skeleton/error. |
| `src/components/CommentsSection.jsx` | Lista y formulario de comentarios con toasts. |
| `src/components/NavBar.jsx` | Búsqueda global, switch de tema y reinicio rápido de filtros. |
| `src/lib/apiClient.js` | Cliente Fetch reutilizable con timeout y normalización de errores. |

## Pruebas manuales recomendadas

1. **Búsqueda:** escribe “django” en el buscador de la `Navbar` y verifica que la home muestre resultados filtrados y reinicie la paginación.
2. **Ordenamiento:** cambia a “Más antiguos” y confirma que la lista se reordena.
3. **Etiquetas:** activa varias etiquetas y observa cómo se combinan con la búsqueda.
4. **Paginación:** navega entre páginas y valida que se mantengan los filtros activos.
5. **Detalle:** abre un post, revisa la carga del contenido y los estados de comentarios.
6. **Comentarios:** publica un comentario válido y comprueba el toast de confirmación y la recarga automática de la lista.
7. **Errores:** desconecta la red (o fuerza un error) para ver el bloque de error con botón “Reintentar”.

## Accesibilidad básica

- Controles navegables con teclado (`focus-visible` y `aria-label` en inputs y botones).
- Botones de paginación con `aria-current` y descripción contextual.
- Imágenes con `alt` descriptivo.
- Toast con botón de cierre y auto-ocultamiento.

## Próximos pasos sugeridos

- Parametrizar `API_BASE_URL` mediante `window.__ENV__?.API_BASE_URL` o `import.meta.env.VITE_API_BASE_URL` con _fallback_ a `/api/`.
- Añadir _retry_ automático opcional para errores de red en el cliente.
- Integrar tests de contrato contra la API para validar cambios futuros.

---

Licencia MIT. ¡Felices commits!
