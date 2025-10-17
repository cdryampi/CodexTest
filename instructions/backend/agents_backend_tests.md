# Agente Backend – Pruebas automatizadas (`/backend`)

Este agente se encargará de mantener y ampliar la batería de pruebas del proyecto Django.

## Alcance
- Trabaja únicamente dentro de la carpeta `/backend`.
- Prioriza las pruebas unitarias y de integración sobre los endpoints ya expuestos en `blog/views.py` y los serializers correspondientes.
- Mantén los casos de prueba dentro de `blog/tests.py` salvo que la complejidad requiera dividirlos en un paquete `tests/` con archivos especializados.

## Cómo ejecutar las pruebas
1. Posiciónate en la carpeta `backend/`.
2. Garantiza que existe una base de datos PostgreSQL disponible. Si estás desarrollando en local puedes reutilizar la orquestación definida en `/deploy/docker-compose.yml`:
   ```bash
   cd deploy
   docker compose up -d postgres
   docker compose run --rm backend python manage.py migrate  # solo si hay migraciones nuevas
   docker compose run --rm backend python manage.py test
   ```
3. Si trabajas sin Docker, crea una base de datos PostgreSQL accesible con las credenciales de `.env` y ejecuta `python manage.py migrate && python manage.py test`.

## Lineamientos para nuevas pruebas
- Cubre tanto respuestas exitosas como validaciones de errores al interactuar con la API REST.
- Siempre que añadas un endpoint nuevo, escribe al menos una prueba que verifique el caso feliz y otra que valide permisos o validaciones relevantes.
- Usa `rest_framework.test.APITestCase` cuando necesites hacer peticiones HTTP completas y `django.test.TestCase` para probar lógica interna de modelos o utilidades.
- Evita fixtures estáticos salvo que sean imprescindibles; prefiere crear los objetos necesarios dentro del test para mantenerlos aislados.
- Documenta cualquier configuración adicional requerida para ejecutar las pruebas (por ejemplo, variables de entorno o datos semilla) directamente en este archivo.

## Checklist previo a abrir un PR
- [ ] Todos los tests pasan (`python manage.py test`).
- [ ] Las migraciones nuevas se aplicaron sobre la base de datos apuntada por la configuración actual.
- [ ] Se actualizó esta guía si cambió la forma de ejecutar o estructurar las pruebas.
