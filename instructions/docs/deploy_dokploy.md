# Despliegue – Dokploy

Esta guía documenta cómo reproducir el despliegue en Dokploy usando las imágenes alojadas en GitHub Container Registry (GHCR) y los artefactos de `/deploy`.

## Prerrequisitos

- Acceso administrativo a una instancia Dokploy >= 1.5.
- Proyecto GitHub con workflow de build/push habilitado.
- Dominios configurados en DNS apuntando a la IP de Dokploy.

## Crear proyecto en Dokploy

1. Ingresa a Dokploy y crea un **Project** (ej. `codextest-blog`).
2. Dentro del proyecto, crea dos **Services** de tipo Docker container:
   - `frontend` → imagen `ghcr.io/<org>/<repo>-frontend:<tag>`.
   - `backend` → imagen `ghcr.io/<org>/<repo>-backend:<tag>`.
3. Habilita la opción *Auto Update* para que Dokploy realice `docker pull` cuando se publique un nuevo tag coincidente.

## Variables y secretos

- Carga el archivo `.env` basado en la plantilla `/deploy/templates/.env.sample` dentro de cada servicio o usa *Environment Groups* para compartir variables.
- Variables mínimas para backend:
  - `DJANGO_SECRET_KEY`
  - `DATABASE_URL` o `POSTGRES_*`
  - `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
  - `VITE_OPEN_IA_KEY`
  - `SEED_ON_STARTUP=0`
- Frontend:
  - `VITE_API_BASE_URL` (apunta a la URL del backend en Dokploy)
  - `VITE_OPEN_IA_KEY`

## Redes, puertos y dominios

- Backend: expón el puerto interno `8000` y publica un dominio tipo `api.example.com`.
- Frontend: expón `80` (Nginx en la imagen) y publica `app.example.com`.
- Si Dokploy administra Let's Encrypt, habilita HTTPS en cada dominio.
- Para escenarios monodominio, crea un servicio reverse proxy adicional que sirva el frontend en `/` y proxyee `/api/` al backend (ver plantilla `nginx.conf`).

## Volúmenes persistentes

- Backend: crea un volumen persistente montado en `/app/media` para archivos de usuario. Opcionalmente monta otro en `/app/staticfiles` si deseas inspeccionarlos.
- PostgreSQL gestionado externamente: configura una base de datos manejada en Dokploy o un servicio aparte con volúmenes `pgdata`.

## Rolling redeploy

1. Activa *Zero Downtime Deployments* (si tu versión de Dokploy lo soporta).
2. Configura *Healthcheck command* con `curl -fsS http://localhost:8000/admin/login/` para backend y `curl -fsS http://localhost/` para frontend.
3. Define timeouts coherentes: `start_period=30s`, `interval=10s`, `retries=5`.
4. Ante un deploy, Dokploy levantará un contenedor nuevo, validará el healthcheck y después reemplazará el antiguo.

## Certificados SSL

- Selecciona *Let's Encrypt* en la sección Domains de cada servicio.
- Verifica que `ALLOWED_HOSTS` y `CSRF_TRUSTED_ORIGINS` incluyan las URLs `https://` correctas antes de activar HTTPS.

## Post-deploy y migraciones

- El entrypoint del backend ejecuta automáticamente `migrate` y `collectstatic`.
- Para migraciones manuales:
  ```bash
  dokploy-cli exec backend -- python manage.py migrate
  dokploy-cli exec backend -- python manage.py seed_categories
  ```
- Guarda estos comandos en el Runbook para operaciones recurrentes.

## Rollback

1. Abre el servicio en Dokploy.
2. En la sección *Deployments*, selecciona el tag anterior (por ejemplo `sha-<hash>` o `1.2.0`).
3. Haz clic en *Redeploy*. El servicio descargará la imagen antigua y realizará un rolling restart.
4. Verifica los logs (`dokploy-cli logs backend`) y el healthcheck antes de dar por finalizado el rollback.

## Integración con CI/CD

- Configura un webhook o utiliza la integración nativa de Dokploy para escuchar push en GHCR.
- Alternativamente, desde GitHub Actions ejecuta una llamada al API de Dokploy (token personal) tras subir las imágenes para forzar el redeploy.

## Observabilidad

- Habilita el endpoint `/admin/login/` como healthcheck mínimo.
- Plan futuro: añadir librerías como `django-health-check` o `django-prometheus` y exponer `/health/` y `/metrics` a través de reglas Dokploy.

Documenta cualquier personalización en `/deploy/templates/dokploy.example.yaml` para que otros proyectos repliquen la configuración rápidamente.
