# Codex Blog – Monorepo React + Django

Monorepo que integra frontend (React + Vite), backend (Django REST Framework) y artefactos de despliegue (Docker + Dokploy) para el blog de Codex. Incluye un sistema de instrucciones multi-agente pensado para ejecutarse en Codex Cloud.

## Arquitectura

```
.
├── frontend/              # Aplicación React 18 + Vite + Tailwind + Flowbite
├── backend/               # Proyecto Django 5 + DRF + autenticación JWT
├── deploy/                # Dockerfiles, docker-compose, entrypoints y Nginx
├── instructions/          # Sistema de agentes, tareas y contexto del proyecto
├── docs/                  # ADRs y documentación adicional
├── UX_NOTES.md            # Notas históricas de experiencia de usuario
└── README.md              # Este documento
```

### Frontend
- React 18 con Vite (SWC) y Router configurado con `basename={import.meta.env.BASE_URL}`.
- Tailwind CSS v4 (o fallback 3.4.x documentado) con Flowbite y Heroicons.
- Gestión de estado ligera con stores o React Query según la tarea.
- Formularios con `react-hook-form` + `zod` y notificaciones `react-hot-toast`.

### Backend
- Django 5 estructurado en múltiples apps (`users`, `blog`, `core`).
- Django REST Framework con SimpleJWT, dj-rest-auth y django-allauth.
- Modelos de `Post`, `Category`, `Tag`, `Comment` con seeds idempotentes.
- Configuración de emails, almacenamiento de media y CORS listo para producción.

### Deploy
- Imágenes basadas en `python:3.12-alpine` (backend) y `node:20`/`alpine` (build frontend).
- Publicación de frontend en GitHub Pages.
- Backend empacado para Dokploy con migraciones y seeds automáticos.
- Publicación de imágenes en GHCR vía GitHub Actions.

## Sistema de agentes

El flujo operativo se documenta en `instructions/agents/README.md` y sigue el orden:

1. UX → 2. Frontend → 3. Backend → 4. QA → 5. DevOps → 6. Docs → 7. Security → 8. Data.

Cada agente cuenta con un archivo dedicado en `instructions/agents/agent_*.md` que define objetivos, entregables y checklist.

## Flujo de lectura recomendado

1. `instructions/CONTEXT.md`
2. `instructions/README.md`
3. `instructions/agents/` (en el orden del flujo)
4. `instructions/tasks/` y `instructions/tasks/TEMPLATE_TASK.md`

## Variables de entorno clave

### Backend
- `DJANGO_SECRET_KEY` — clave secreta obligatoria.
- `DJANGO_DEBUG` — `true/false`.
- `DJANGO_ALLOWED_HOSTS` — lista separada por comas.
- `DJANGO_CORS_ORIGINS` — orígenes para CORS.
- `DATABASE_URL` o variables `POSTGRES_*`.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`.
- `AWS_*` u otras variables de storage si aplica.

### Frontend
- `VITE_API_BASE_URL` — URL base del backend.
- `VITE_AUTH_TOKEN_KEY` — clave de almacenamiento local para tokens JWT.
- `VITE_ENABLE_MOCKS` — opcional para activar mocks.

Documenta cualquier cambio adicional en `.env.example` y en `instructions/CHANGELOG.md`.

## Scripts útiles

### Frontend
```bash
npm install            # Instalar dependencias
npm run dev            # Servidor de desarrollo Vite
npm run build          # Generar build para Pages
npm run preview        # Previsualizar build
```

### Backend
```bash
pip install -r requirements.txt      # Instalar dependencias
python manage.py migrate             # Aplicar migraciones
python manage.py seed_categories     # Ejecutar seeds base
python manage.py runserver 0.0.0.0:8000
```

### Docker / Deploy
```bash
docker compose up --build            # Ambiente local completo
./deploy/backend/entrypoint.sh       # Flujo de arranque del backend en contenedor
dokploy deploy backend              # Despliegue (ejemplo, requiere CLI configurada)
```

## QA rápido

- Frontend: `npm test`, `npx playwright test`
- Backend: `pytest --ds=config.settings.test`
- Lint: `npm run lint`, `ruff check`, `bandit -r backend`

## Contribución

1. Revisa tareas disponibles en `instructions/tasks/` o crea una nueva con la plantilla.
2. Ejecuta agentes siguiendo el flujo oficial y respetando el formato de entrega (`ruta\ncontenido`).
3. Actualiza documentación y variables cuando introduzcas cambios significativos.
4. Asegura que las suites de QA pasen antes de abrir un PR.
