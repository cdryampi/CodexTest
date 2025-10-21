# Despliegue – Panorama general

Esta guía describe la arquitectura objetivo del proyecto y cómo reutilizarla en futuros repositorios manteniendo compatibilidad con los artefactos actuales ubicados en `/deploy`. Todos los pasos están alineados con los Dockerfiles, `docker-compose.yml` y flujos de CI/CD existentes.

## Componentes principales

- **Frontend (React + Vite)**: se construye como artefacto estático y se sirve mediante Nginx en un contenedor propio.
- **Backend (Django + Gunicorn)**: empaquetado con `deploy/backend.Dockerfile`, expone HTTP en el puerto interno `8000` y utiliza WhiteNoise para los archivos estáticos.
- **Base de datos**: PostgreSQL 16 por defecto. El repositorio incluye instrucciones para alternar a SQLite cuando se requiera simplicidad.
- **Proxy / Edge**: Dokploy actúa como orquestador y reverse proxy con certificados TLS emitidos por Let's Encrypt.

## Diagrama textual

```
[Internet]
   |
   | 443/80
[DOKPLOY]
   |-- proxy_pass / -> frontend (nginx) :8080 (cont)
   |-- proxy_pass /api/ -> backend (gunicorn) :8000 (cont)
          |-- red interna backend_net
          |        |-- volumen media:/app/media
          |        |-- postgres:5432 (volumen pgdata_v3)
```

- La red `backend_net` se define como `bridge` en Docker y conecta backend y base de datos.
- Los volúmenes nombrados actuales son `pgdata_v3` (datos PostgreSQL) y `backend_media` (archivos cargados por usuarios).

## Matriz de entornos

| Variable clave | Local (compose) | Staging | Producción |
| -------------- | --------------- | ------- | ---------- |
| `DEBUG` | `1` (o `true`) | `0` | `0` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | dominio de staging + Dokploy internal host | dominios públicos + IP del proxy |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | URL frontend staging | URL(s) frontend producción |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:5173` | `https://staging.example.com` | `https://app.example.com` |
| `DATABASE_URL` | opcional (`sqlite:///...`) | `postgres://…` (GHCR secret) | `postgres://…` gestionado por Dokploy |
| `DJANGO_SECRET_KEY` | valor de desarrollo en `.env` local | secreto en Dokploy | secreto en Dokploy |
| `VITE_OPEN_IA_KEY` | en `.env` local + GitHub Secrets | Dokploy Secret | Dokploy Secret |
| `SEED_ON_STARTUP` | `1` si se desean datos demo | `0` salvo demos | `0` |

> Nota: las variables aceptan prefijos alternos (`DJANGO_*`) según la configuración del `settings.py`. Utiliza el formato más conveniente para tus pipelines.

## Estrategia de despliegue

1. **Build**: GitHub Actions compila los contenedores `frontend` y `backend` usando los Dockerfiles reales.
2. **Push**: las imágenes se etiquetan como `:latest`, `:${{ github.sha }}` y `:${{ version }}` (cuando corresponde) y se suben a GHCR.
3. **Deploy**: Dokploy escucha nuevos tags y ejecuta un pull + rolling restart de los servicios configurados.
4. **Post-deploy**: los entrypoints realizan migraciones (`python manage.py migrate`) y `collectstatic`. Opcionalmente pueden ejecutar `seed_categories` mediante `SEED_ON_STARTUP=1`.

## Gestión de secretos

- **GitHub Secrets**: guardar `GHCR_TOKEN`, `GHCR_USERNAME`, `DJANGO_SECRET_KEY`, `DATABASE_URL` (o pares `POSTGRES_*`), `VITE_OPEN_IA_KEY` y cualquier clave API adicional.
- **Dokploy Secrets**: replicar los anteriores respetando los nombres esperados por el compose/entrypoint. Dokploy permite agruparlos en un `.env` adjunto al servicio.
- **Local**: utilizar `.env` (no versionado) siguiendo la plantilla incluida en `/deploy/templates/.env.sample`.

## Consideraciones adicionales

- **SQLite**: para prototipos, apunta `DATABASE_URL=sqlite:///db.sqlite3` y desactiva el servicio `postgres` en `docker-compose.override.yml`.
- **Media**: el volumen `backend_media` se debe respaldar periódicamente; en Dokploy se declara como volumen persistente.
- **Healthchecks**: el backend expone `/admin/login/` y se usa en el `HEALTHCHECK` actual. Puedes agregar un endpoint dedicado (`/health/`) en el futuro.
- **Rollback**: Dokploy permite seleccionar tags anteriores de GHCR y redeployar sin detener el tráfico.

Mantén esta guía como referencia maestra y sincroniza cualquier cambio de infraestructura con los templates ubicados en `/deploy/templates`.
