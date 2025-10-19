Pruebas de migraciones con SQLite (modo TEST)

Objetivo:
Validar que las migraciones y pruebas básicas del backend Django se ejecutan correctamente usando SQLite en un entorno aislado,
sin tocar la configuración PostgreSQL real ni depender de acceso externo.

Procedimiento manual (cuando necesites verificar algo en local):

Instalar dependencias:

pip install -r backend/requirements.txt

Configurar entorno (ignorar TEST_DB o DATABASE_URL si existen):

export DJANGO_SETTINGS_MODULE=backend.settings_test
export PYTHONPATH="$PWD:$PWD/backend"
unset DATABASE_URL
unset TEST_DB

La base de datos se ubicará en: backend/tests/db/test.sqlite3.

Ejecutar:

python backend/manage.py migrate --noinput
python backend/manage.py check
python backend/manage.py showmigrations
pytest -q || python backend/manage.py test

Limpieza opcional:

rm -f backend/tests/db/test.sqlite3

Automatización en GitHub Actions:

- Existe un workflow en `.github/workflows/backend-tests.yml` que ejecuta estas tareas con SQLite en cada push o pull request.
- No es necesario despertar ni conectarse a bases externas; el pipeline usa exclusivamente `backend.settings_test`.

Recordatorios:

- No modificar `backend/settings.py` ni `docker-compose.yml`.
- No subir archivos SQLite ni `backend/sql.json` si llegas a generarlo.
- El modo SQLite es sólo para pruebas del agente; en producción se mantiene PostgreSQL.
