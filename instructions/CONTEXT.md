# Contexto actualizado del monorepo

## Estado general
- Se añadió soporte integral de categorías en backend y frontend para enriquecer la navegación del blog.
- Las categorías se incluyen en los seeds y migran automáticamente al iniciar los contenedores Docker del backend.

## Backend
- Nuevo modelo `Category` con slug único, metadatos de auditoría y relación ManyToMany con `Post`.
- Serializadores y vistas exponen `categories` (por slug) y `categories_detail` (metadatos completos).
- Endpoints disponibles:
  - `GET /api/categories/` con filtros `q`, `is_active` y `with_counts` para obtener el número de posts asociados.
  - `GET /api/categories/<slug>/` para detalle.
  - `GET /api/posts/?category=<slug>` para filtrar publicaciones.
- Comando `seed_categories` mantiene un catálogo base idempotente. Los seeds de posts asignan 1–3 categorías aleatorias.
- Las migraciones corren automáticamente en Docker seguido de `seed_categories` para garantizar datos mínimos.

## Frontend
- La capa de datos se movió a `src/api/index.js` con funciones `listPosts`, `getPost`, `listComments`, `createComment` y `getCategories` con degradación a seeds.
- Cada post expone `categories` y `categories_detail`; los listados muestran badges de categoría y permiten buscar por ellas.
- Nueva barra lateral (`CategorySidebar`) con Flowbite para navegar entre categorías, incluye contador y botón para limpiar filtros.
- `CategorySkeleton` brinda feedback de carga mientras se obtienen categorías.
- El estado global (`useUIStore`) ahora recuerda categoría seleccionada y sincroniza filtros con paginación.

## Deploy
- El entrypoint del backend ejecuta `makemigrations`, `migrate` y `seed_categories` antes de `collectstatic` y Gunicorn, manteniendo el esquema actualizado en cada arranque.

## Documentación y pruebas
- Se documentó el prompt completo en `instructions/tasks/2025-10-categorias-blog.md` y se actualizaron estos archivos de contexto y changelog.
- Nuevas pruebas API en `backend/blog/tests/test_categories.py` validan creación/listado de categorías, filtrado de posts y creación de posts con categorías.
