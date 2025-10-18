# PROMPT PARA CODEX — FEATURE: CATEGORÍAS DEL BLOG (PR AUTOMÁTICO)

**Rol:**  
Eres Codex ejecutando una tarea de producción directa.  
Debes modificar solo dentro de `/frontend`, `/backend`, `/deploy`, `/instructions`.  
Entrega solo archivos con su ruta y bloque de código completo, sin texto adicional.  
El resultado será un PR listo para merge.

---

## Objetivo
Agregar **categorías** al blog:
- Modelo y API REST en Django.
- Relación ManyToMany con `Post`.
- Fixtures y seeds automáticos.
- Sidebar en frontend (Flowbite) con skeleton de carga.
- Filtrado de posts por categoría.
- Migraciones automáticas en Docker.
- Documentación y tests.

---

## Backend (Django + DRF)

1. **Modelo Category** (`/backend/blog/models.py`):
   - Campos: `name`, `slug`, `description`, `is_active`, `created_at`, `updated_at`.
   - Slug único autogenerado.
   - Relación ManyToMany con `Post`.

2. **Serializers** (`/backend/blog/serializers.py`):
   - `CategorySerializer`: name, slug, description, is_active.
   - Extender `PostSerializer` con `categories` (slugs) y `categories_detail`.

3. **API** (`/backend/blog/views.py` y `urls.py`):
   - `GET /api/categories/` (filtros `q`, `is_active`, `with_counts`).
   - `GET /api/categories/<slug>/`.
   - `/api/posts/?category=slug` para filtrar posts.
   - Lectura pública, edición con auth.

4. **Fixtures y Seeds:**
   - `/backend/blog/fixtures/categories.json`: 8–12 categorías base.
   - `/backend/blog/fixtures/posts.json`: posts con 1–3 categorías.
   - `/backend/blog/management/commands/seed_categories.py`: idempotente.

5. **Docker Backend:**
   - Ejecutar al iniciar:
     ```
     python manage.py makemigrations --noinput && \
     python manage.py migrate --noinput && \
     python manage.py seed_categories
     ```

6. **Tests:** (`/backend/blog/tests/test_categories.py`)
   - Crear y listar categorías.
   - Filtrar posts por categoría.
   - Crear post con categorías.

---

## Frontend (React + Flowbite)

1. **API (`/frontend/src/api/index.js`):**
   - `getCategories({ q, is_active, with_counts })`
   - Extender `getPosts()` para aceptar `category`.

2. **Componentes:**
   - `/frontend/src/components/CategorySidebar.jsx`: Flowbite Sidebar, lista de categorías, contador, skeleton.
   - `/frontend/src/components/CategorySkeleton.jsx`: loader visual.

3. **Integración:**
   - Mostrar Sidebar lateral.
   - Al hacer clic en categoría → filtrar posts (`?category=slug`).
   - Skeleton visible mientras carga.
   - Compatible con modo oscuro y responsive.

---

## Docker / CI
- Backend aplica migraciones y seeds sin error.
- Tests y build deben pasar en GH Actions.
- PR limpio y mergeable.

---

## Documentación
- Crear `/instructions/tasks/2025-10-categorias-blog.md` con este prompt.
- Actualizar `/instructions/CONTEXT.md` y `/instructions/CHANGELOG.md`.

---

## Criterios de aceptación
- `/api/categories/` y `/api/categories/<slug>/` funcionan.
- Filtrado de posts por categoría operativo.
- Sidebar visible y funcional con skeleton.
- Seeds sin duplicados.
- Migraciones sin errores.
- CI/CD exitoso y merge automático.

---

## Acciones finales
1. Crear rama `feature/categories-blog`.  
2. Commit: `[ADD] Categorías del blog — Backend + Frontend + Docker`.  
3. Crear PR y merge automático si pasa CI/CD.

---
