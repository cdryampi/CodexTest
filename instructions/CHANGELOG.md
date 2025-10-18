# Changelog

## 2025-10-18 – Categorías del blog
- Backend incorpora modelo `Category`, endpoints `/api/categories/` y filtros de posts por categoría.
- Nuevos seeds (`seed_categories`) y fixtures sincronizan categorías con posts y se ejecutan automáticamente al iniciar Docker.
- Pruebas dedicadas (`backend/blog/tests/test_categories.py`) cubren creación/listado y uso de categorías al crear posts.
- Frontend migra la capa de datos a `src/api/index.js`, añade `getCategories` y soporta filtrado por categoría.
- Sidebar de categorías (Flowbite) y skeleton de carga integrados en la página principal.
- Documentación ampliada en `instructions/CONTEXT.md` y se registra el prompt original en `instructions/tasks/2025-10-categorias-blog.md`.
