# Backend – Consideraciones de CORS

El frontend consume la API pública alojada en `https://backendblog.yampi.eu/`. Mientras la URL base sea estática, asegúrate de incluir el origen del cliente en la configuración de CORS del proyecto Django.

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://backendblog.yampi.eu",
    "https://<tu-usuario>.github.io",
    "https://<dominio-personal>",
]
```

Cuando se parametrice la base URL en el frontend (via `window.__ENV__?.API_BASE_URL` o `import.meta.env.VITE_API_BASE_URL`), actualiza esta lista con los nuevos dominios públicos. Para entornos controlados (staging/dev) se puede seguir usando `CORS_ALLOW_ALL_ORIGINS=False` junto a la lista explícita.
