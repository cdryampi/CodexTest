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
- Panel de backoffice protegido bajo `/dashboard` con CRUD completo de posts, categorías y tags.
- Tablas responsivas con `@tanstack/react-table`, multiselect con `react-select`, editor enriquecido con `react-quill` y slugs generados con `slugify`.
- Subida de imágenes a través de `multipart/form-data`; requiere que el backend exponga `/media/` y haya sesión iniciada para adjuntar tokens JWT.

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

### Backend (`backend/.env`)
- `SECRET_KEY` — clave secreta obligatoria para Django.
- `DEBUG` — activa/desactiva modo depuración.
- `ALLOWED_HOSTS` — dominios permitidos separados por comas.
- `CORS_ALLOWED_ORIGINS` — dominios adicionales autorizados para CORS.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL`, `DEFAULT_FROM_EMAIL` — credenciales SMTP (en desarrollo se usa consola automáticamente).
- `DATABASE_URL` o variables `POSTGRES_*` — conexión a base de datos.

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` — URL base del backend (termina en `/api/`).

Actualiza `.env.example` y `instructions/CHANGELOG.md` cuando agregues nuevas variables.

## Autenticación de usuarios

### Endpoints principales
- `POST /api/auth/login/` — inicia sesión y devuelve `access` + `refresh` JWT.
- `POST /api/auth/token/refresh/` — renueva el `access` token usando el `refresh`.
- `POST /api/auth/registration/` — registra usuarios nuevos y envía correo de bienvenida.
- `GET /api/auth/user/` — datos del usuario autenticado.

### Flujo y consideraciones
- El frontend guarda `access` y `refresh` en `localStorage` y añade el encabezado `Authorization: Bearer <token>` en cada petición.
- Los interceptores de Axios refrescan automáticamente el token de acceso ante un `401`; si el refresh falla se fuerza el cierre de sesión.
- El backend usa SimpleJWT con vigencia de 10 minutos para `access` y 14 días para `refresh`, rotando este último en cada renovación.
- En desarrollo los correos de bienvenida se imprimen en consola; en producción se envían mediante SMTP configurado por variables de entorno.

### Variables mínimas para autenticación
- **Backend:** `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS/EMAIL_USE_SSL`, `DEFAULT_FROM_EMAIL`.
- **Frontend:** `VITE_API_BASE_URL` apuntando al dominio público del backend (`https://backendblog.yampi.eu/api/` o similar).

### QA rápido de autenticación
1. Levanta el backend localmente y observa el log tras registrar un usuario nuevo:
   ```bash
   python manage.py runserver
   # POST /api/auth/registration/ …
   # [console]
   Content-Type: text/html; charset="utf-8"
   Subject: =?utf-8?q?Bienvenido/a_a_CodexTest_Blog?=
   From: CodexTest Blog <no-reply@example.com>
   To: persona@example.com
   ```
2. Inicia sesión desde el frontend (`/login`), verifica que los tokens aparecen en `localStorage` y que la barra de navegación muestra "Perfil" y "Cerrar sesión".
3. Accede a `/profile`; fuerza la expiración del `access` eliminándolo y realiza una navegación: el interceptor solicitará un token nuevo con `refresh`.

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
