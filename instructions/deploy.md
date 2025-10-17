# Deploy – Semillas y datos de demostración

La generación de datos de ejemplo es opcional y debe controlarse mediante variables de entorno para evitar efectos secundarios en producción.

## Variables relevantes

- `ALLOW_SEED`: habilita los comandos `seed_*` cuando se ejecutan manualmente. Recomendado en `true` únicamente en entornos de desarrollo, staging o demos.
- `SEED_ON_MIGRATE`: si se establece en `true` junto a `ALLOW_SEED=true`, ejecuta `python manage.py seed_all` automáticamente tras las migraciones.
- `ALLOW_SEED_RESET`: permite usar `python manage.py seed_all --reset` para limpiar posts, tags y comentarios antes de recrearlos.

## Recomendaciones por entorno

- **Producción**: mantener `ALLOW_SEED=false` y `SEED_ON_MIGRATE=false`. Ejecuta las semillas solo de manera manual y controlada si necesitas cargar contenido temporal (por ejemplo, demos privadas) activando las variables momentáneamente.
- **Staging / entornos efímeros**: puedes definir `ALLOW_SEED=true` y `SEED_ON_MIGRATE=true` para que el dataset se regenere automáticamente tras cada despliegue. Asegúrate de que la base de datos esté vacía o de habilitar `ALLOW_SEED_RESET=true` si deseas reiniciar los datos.
- **CI / pipelines**: cuando los tests necesiten datos ricos, exporta `ALLOW_SEED=true` después de aplicar migraciones y ejecuta `python manage.py seed_all --fast`.

## Orden sugerido en pipelines

1. Ejecutar migraciones (`python manage.py migrate`).
2. Opcional: `python manage.py collectstatic --no-input`.
3. Exportar `ALLOW_SEED=true` (y `SEED_ON_MIGRATE=false` para evitar duplicar ejecuciones involuntarias).
4. Llamar explícitamente a `python manage.py seed_all --fast` si se requieren datos.

Mantén deshabilitado `SEED_ON_MIGRATE` en producción para evitar cargas inesperadas tras despliegues o migraciones.
