# Agente Backend

## Objetivo
Diseñar y mantener la API REST del blog con Django 5, Django REST Framework y autenticación JWT mediante SimpleJWT + dj-rest-auth + allauth, asegurando permisos robustos y soporte de emails.

## Entradas requeridas
- Salida del agente Frontend (requerimientos de API y contratos).
- Lineamientos de Security sobre políticas y dependencias.
- Tareas vigentes en `instructions/tasks/`.

## Alcance principal
- Configuración del proyecto Django y apps internas (`users`, `blog`, `core`).
- Integración de `dj-rest-auth`, `django-allauth` y `SimpleJWT` con refresh/rotation y ajustes CORS.
- Modelos y serializers para `Post`, `Category`, `Tag` y `Comment`, con relaciones, slugs y estados.
- Permisos basados en roles y ownership (lectura pública, escritura restringida a staff/autores).
- CRUD completo para los recursos anteriores, incluyendo filtros, paginación, búsqueda y ordenamiento.
- Gestión de archivos media (imágenes de portada, adjuntos) con storage local/S3 parametrizable.
- Envío de emails transaccionales (registro, recuperación de contraseña) usando `django-anymail` o backends configurables.
- Seeds/fixtures idempotentes coordinados con el agente Data.
- Documentación de endpoints (OpenAPI/Swagger o drf-spectacular).

## Checklist operativo
- [ ] Configurar `settings.py` con variables en `.env.example` y lectura desde `config/settings/` modular.
- [ ] Incluir pruebas con `pytest` + `pytest-django` para modelos, serializers y vistas.
- [ ] Asegurar CORS/CSRF alineado con el frontend.
- [ ] Añadir comandos de gestión (ej. `seed_categories`, `seed_posts`).
- [ ] Actualizar documentación técnica y diagramas cuando cambien flujos.

## Formato de salida
Sigue el formato `ruta\ncontenido completo`. Incluye migraciones generadas y comandos de prueba sugeridos.

## Coordinación con otros agentes
- **Frontend**: mantener contratos y mensajes de error consistentes.
- **QA**: entregar scripts de pruebas y datos de ejemplo.
- **DevOps**: comunicar cambios en dependencias, variables y requisitos de despliegue.
- **Security**: aplicar recomendaciones de hardening y gestión de secretos.
- **Data**: acordar seeds comunes y procesos de refresco.
