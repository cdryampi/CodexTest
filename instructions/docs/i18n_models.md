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

* **Unicidad por idioma**: cada traducción define un índice de unicidad `(language_code, slug)` además del par estándar `(language_code, master)` de parler. Esto garantiza que no se repita un slug dentro del mismo idioma sin limitar las traducciones en otros idiomas.
* **Índices compuestos**:
  * `PostTranslation(language_code, title)`
  * `CategoryTranslation(language_code, name)`
  * `TagTranslation(language_code, name)`

Estos índices aceleran búsquedas y ordenamientos por campos traducibles en el admin y futuras consultas multi-idioma.

## Migraciones

Se añadieron dos migraciones nuevas en `backend/blog/migrations`:

1. `0005_parler_schema.py`: crea las tablas de traducción (`CategoryTranslation`, `PostTranslation`, `TagTranslation`), aplica las restricciones de unicidad y los índices compuestos.
2. `0006_parler_data_migration.py`: copia los valores existentes al idioma por defecto y elimina las columnas antiguas (`title`, `slug`, `excerpt`, `content`, `name`, `description`). También incluye un camino inverso seguro para restaurar los valores originales en caso de rollback.

Ambas migraciones son reversibles y pueden ejecutarse sobre SQLite (modo test) o PostgreSQL.

## Administración

El panel de Django usa `TranslatableAdmin`, lo que habilita pestañas por idioma y búsquedas sobre los campos traducibles. La validación de slugs se realiza por idioma con mensajes claros al usuario.

## Consideraciones futuras

* Los serializers y vistas siguen leyendo/escribiendo en el idioma por defecto. Las nuevas tablas preparan el terreno para servir contenido multi-idioma en fases posteriores.
* `TranslationAwareQuerySet` permite seguir utilizando filtros, búsquedas y `Q` objects con los nombres de campo originales sin cambios en la API existente.
