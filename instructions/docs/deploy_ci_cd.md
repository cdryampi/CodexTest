# Despliegue – CI/CD (GitHub Actions + GHCR)

Este documento detalla el pipeline sugerido para construir, testear y publicar imágenes Docker del frontend y backend en GitHub Container Registry (GHCR), habilitando despliegues automáticos vía Dokploy.

## Flujo recomendado

1. Ejecutar linters y tests (backend + frontend) para asegurar calidad antes del build.
2. Construir imágenes Docker reutilizando cache de capas.
3. Autenticarse contra GHCR con `docker/login-action`.
4. Etiquetar imágenes con:
   - `latest`
   - `sha-<github.sha>`
   - `ref-<branch>` o `v<semver>` para releases
5. Empujar (`docker push`) las etiquetas.
6. (Opcional) Notificar a Dokploy mediante webhook/API para disparar redeploy inmediato.

## Secrets necesarios en GitHub

Configura los siguientes secretos en `Settings → Secrets and variables → Actions`:

- `GHCR_USERNAME`: normalmente `${{ github.repository_owner }}`.
- `GHCR_TOKEN`: token personal con `write:packages`.
- `DJANGO_SECRET_KEY`: usado en tests/build si requiere.
- `DATABASE_URL` o `POSTGRES_*`: solo si el build ejecuta migraciones/tests que necesitan DB.
- `VITE_OPEN_IA_KEY`: necesario para construir el frontend si accede a la API.
- `DOKPLOY_API_URL` y `DOKPLOY_API_TOKEN` (opcional) para notificaciones post-push.

Utiliza variables (`env:`) para valores no sensibles, como `REGISTRY=ghcr.io` y `IMAGE_NAME_BACKEND=${{ github.repository }}-backend`.

## Jobs sugeridos

```yaml
name: Deploy (Templates)

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --watch=false
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r backend/requirements.txt
      - run: python -m pytest backend

  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    env:
      REGISTRY: ghcr.io
      IMAGE_BACKEND: ${{ github.repository }}-backend
      IMAGE_FRONTEND: ${{ github.repository }}-frontend
    steps:
      - uses: actions/checkout@v4
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.GHCR_USERNAME }}
          password: ${{ secrets.GHCR_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_BACKEND }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_FRONTEND }}
          tags: |
            type=raw,value=latest
            type=sha
            type=ref,event=branch
            type=semver,pattern={{version}}
      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: deploy/backend.Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_BACKEND }}:cache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_BACKEND }}:cache,mode=max
      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: deploy/Dockerfile.frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_FRONTEND }}:cache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_FRONTEND }}:cache,mode=max
      - name: Notify Dokploy (optional)
        if: success() && secrets.DOKPLOY_API_URL
        run: |
          curl -X POST "$DOKPLOY_API_URL" \
            -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"project":"codextest-blog","services":["frontend","backend"]}'
```

> Ajusta los paths (`deploy/Dockerfile.frontend`) al nombre real del archivo cuando exista (puedes usar la plantilla incluida en `/deploy/templates`).

## Buenas prácticas

- **Cache**: usa `cache-from` y `cache-to` para reducir tiempos de build. Mantenlos separados por servicio.
- **Multi-stage**: los Dockerfiles de plantilla ya usan multi-stage para el frontend y optimizaciones en backend; respétalos.
- **Fail fast**: aborta el pipeline si fallan tests o linters antes de gastar minutos de build.
- **Etiquetas consistentes**: evita mezclar notaciones (`latest`, `prod`, etc.). Usa semver en releases y `sha-` para auditoría.
- **Seguridad**: restringe el token de GHCR a `write:packages` y revísalo periódicamente.

Mantén este flujo sincronizado con `/deploy/templates/.github/workflows/deploy.yml.template` para acelerar la creación de nuevos repositorios basados en este stack.
