#!/bin/sh
set -eu

cd /app

mkdir -p /app/staticfiles /app/media

python <<'PY'
import os
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backendblog.settings")

import django  # noqa: E402
from django.db import connections  # noqa: E402
from django.db.utils import OperationalError  # noqa: E402

django.setup()

max_retries = int(os.getenv("DB_MAX_RETRIES", "30"))
delay = float(os.getenv("DB_RETRY_DELAY", "1"))

for attempt in range(max_retries):
    try:
        connections["default"].ensure_connection()
    except OperationalError:
        time.sleep(delay)
    else:
        break
else:
    raise SystemExit("Database not available")
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput

WORKERS="${GUNICORN_WORKERS:-3}"
THREADS="${GUNICORN_THREADS:-1}"
TIMEOUT="${GUNICORN_TIMEOUT:-120}"

exec gunicorn backendblog.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "$WORKERS" \
    --threads "$THREADS" \
    --timeout "$TIMEOUT"
