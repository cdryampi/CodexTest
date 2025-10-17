FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apk add --no-cache build-base postgresql-dev

WORKDIR /app

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend /app

EXPOSE 8000

CMD ["sh", "-c", "gunicorn backendblog.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3}"]
