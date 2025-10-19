# TAREA – Autenticación, Backoffice y CRUD completo (Django + React)

## Objetivo
Integrar usuarios Django con JWT y endpoints REST (login/registro), CRUD de Post/Category/Tag, backoffice protegido, email en registro, y despliegues funcionales en Pages y Dokploy.

## Alcance
- Backend Django 5 + DRF + SimpleJWT + dj-rest-auth + allauth + CORS + emails + media.
- Frontend React + Vite + Tailwind + Flowbite + Heroicons + axios + react-hook-form + zod + react-hot-toast + rutas privadas.
- Docker backend basado en `python:3.12-alpine` con Gunicorn, volumen `media`, SMTP y variables de entorno documentadas.

## Flujo de agentes
1. UX → Diseña flujos de autenticación, dashboard y CRUD.
2. Frontend → Implementa UI, formularios, validaciones y consumo de API.
3. Backend → Configura auth JWT, endpoints REST y lógica de email.
4. QA → Automatiza pruebas unitarias, integración y e2e.
5. DevOps → Actualiza Dockerfiles, docker-compose, GHCR y despliegues en Dokploy/Pages.
6. Docs → Documenta README, `.env.example`, scripts y ADR si aplica.
7. Security → Revisa permisos, CORS/CSRF, headers y gestión de secretos.
8. Data → Genera seeds/fixtures para usuarios, categorías, posts y comentarios.

## Entregables
- [ ] Endpoints REST autenticación y CRUD operativos.
- [ ] Interfaz web con login, registro, dashboard y formularios CRUD.
- [ ] Pipelines de CI/CD con pruebas y build/despliegue automatizados.
- [ ] Documentación actualizada y seeds listos.

## Criterios de aceptación
1. Registro envía email por consola y requiere verificación mínima.
2. Login almacena tokens y permite acceso a `/dashboard` protegido.
3. CRUD completo de Post/Category/Tag desde API y backoffice.
4. CORS configurado para frontend en Pages; build y deploy funcionales.

## Variables de entorno
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ORIGINS`, `DATABASE_URL` o variables PostgreSQL.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`.
- `VITE_API_BASE_URL`, `VITE_AUTH_TOKEN_KEY` para frontend.

## QA rápido
- `pytest --ds=config.settings.test`.
- `npm test` y `npx playwright test` en frontend.
- `docker compose up --build` y verificación manual de login/CRUD.

## Notas adicionales
- Documentar rutas privadas y roles (admin/editor/lector).
- Incluir ejemplo de configuración SMTP local (Mailhog o consola).
