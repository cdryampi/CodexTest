# Modelos traducibles con django-parler

La segunda fase de internacionalización convierte los modelos principales del blog en entidades traducibles con [`django-parler`](https://django-parler.readthedocs.io/). Esta iteración sólo persiste las traducciones en base de datos; las API públicas continúan respondiendo en el idioma por defecto (`settings.LANGUAGE_CODE`).

## Campos traducibles

| Modelo    | Campos traducibles                       | Fallback slug |
|-----------|-------------------------------------------|---------------|
| `Post`    | `title`, `slug`, `excerpt`, `content`     | `post`        |
| `Category`| `name`, `slug`, `description`             | `categoria`   |
| `Tag`     | `name`, `slug`                            | `etiqueta`    |

El resto de atributos (imágenes, fechas, relaciones, estados) se mantienen como campos normales.

## Restricciones y optimizaciones

* **Unicidad por idioma**: la validación de modelos garantiza que no se repita un slug dentro del mismo idioma (`clean()` verifica la ausencia de duplicados antes de guardar). El esquema mantiene la restricción estándar de parler `(language_code, master)` para identificar cada traducción.
* **Índices**: se trabajan los campos traducibles directamente desde Django sin índices adicionales. Si en el futuro se detecta algún cuello de botella en búsquedas multi-idioma, se podrán añadir `BTree` compuestos específicos mediante una migración dedicada.

## Migraciones

Se añadieron migraciones nuevas en `backend/blog/migrations`:

1. `0005_parler_schema.py`: crea las tablas de traducción (`CategoryTranslation`, `PostTranslation`, `TagTranslation`) y define las relaciones base para trabajar con `TranslatedFields`.
2. `0006_parler_data_migration.py`: copia los valores existentes al idioma por defecto y elimina las columnas antiguas (`title`, `slug`, `excerpt`, `content`, `name`, `description`). También incluye un camino inverso seguro para restaurar los valores originales en caso de rollback.
3. `0007_remove_translation_indexes.py`: elimina los índices automáticos generados en la migración estructural y deja únicamente la restricción `(language_code, master)` gestionada por parler.

Todas las migraciones son reversibles y pueden ejecutarse sobre SQLite (modo test) o PostgreSQL.

## Administración

El panel de Django usa `TranslatableAdmin`, lo que habilita pestañas por idioma y búsquedas sobre los campos traducibles. La validación de slugs se realiza por idioma con mensajes claros al usuario.

## Consideraciones futuras

* Los serializers y vistas siguen leyendo/escribiendo en el idioma por defecto. Las nuevas tablas preparan el terreno para servir contenido multi-idioma en fases posteriores.
* `TranslationAwareQuerySet` permite seguir utilizando filtros, búsquedas y `Q` objects con los nombres de campo originales sin cambios en la API existente.
