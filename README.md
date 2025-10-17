# Monorepo React Tailwind Blog

Este repositorio se reorganizó como un monorepo que agrupa frontend, backend (en preparación), configuración de despliegue y documentación modular.

## Estructura

- `frontend/`: módulo React listo para desplegar en GitHub Pages. Consulta `frontend/README.md` para detalles técnicos.
- `backend/`: carpeta reservada para la futura API de Django REST Framework.
- `deploy/`: artefactos de despliegue Docker + Dokploy (actualmente placeholders documentados).
- `instructions/`: guías para los diferentes agentes (frontend, backend, deploy, UX) y visión general del monorepo.
- `.github/workflows/deploy.yml`: pipeline existente que continúa publicando el frontend en GitHub Pages.

## Comandos principales

Desde la raíz del repositorio:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Los scripts delegan en la configuración ubicada en `frontend/` y generan la carpeta `dist/` en la raíz para mantener el despliegue de GitHub Pages.

## Próximos pasos

- Definir la API en `backend/` usando Django REST Framework.
- Completar la configuración Docker y Dokploy en `deploy/` y publicar imágenes en GHCR.
- Extender la documentación colaborativa dentro de `instructions/` a medida que avanza cada módulo.
