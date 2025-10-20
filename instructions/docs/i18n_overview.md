# Plan de internacionalización del backend

## Objetivos generales
- Preparar el backend de Django para soportar contenido multilingüe.
- Integrar `django-parler` y utilidades de localización sin alterar todavía los modelos existentes.
- Mantener la compatibilidad con los endpoints y configuraciones actuales mientras se habilitan las bases para futuras fases.

## Fases del trabajo
1. **Parte 1/3 – Preparación y configuración (esta entrega).** Instalación de dependencias, ajuste de `settings.py`, activación del middleware de idioma y creación de utilidades comunes.
2. **Parte 2/3 – Modelos y administración.** Migrar progresivamente los modelos (`Post`, `Category`, etc.) a campos traducibles, actualizar el panel de administración y revisar los seeds.
3. **Parte 3/3 – API y experiencia de usuario.** Adaptar serializers, vistas, endpoints y documentación pública para exponer y consumir las traducciones disponibles.

## Cambios clave de configuración
- Añadidos `django-parler`, `django-parler-rest` y `python-slugify` a las dependencias del backend.
- Configuración de `LANGUAGES` (español e inglés), bandera `I18N_ENABLED`, y `PARLER_LANGUAGES` con _fallback_ hacia el idioma por defecto.
- Inclusión de `LocaleMiddleware` tras `SessionMiddleware` para respetar la negociación del idioma.
- Utilidades en `blog/utils/i18n.py` para resolver el idioma activo, fijar el contexto de `parler` y generar slugs localizados.

## Riesgos identificados
- **Inconsistencias temporales en datos:** al introducir traducciones posteriormente, los registros existentes podrían carecer de variantes en todos los idiomas.
- **Desajustes en caché o SEO:** la creación de slugs multilingües requerirá revisar reglas de redirección y referencias externas.
- **Sobrecarga de mantenimiento:** cada campo traducible duplicará la información a validar y sincronizar en futuras migraciones.

## Estrategia de rollback
- Revertir la instalación de paquetes retirándolos de `requirements.txt` y ejecutando `pip uninstall` si ya se instalaron.
- Deshacer las modificaciones en `settings.py` restaurando `INSTALLED_APPS`, `MIDDLEWARE` y la configuración de idioma previa.
- Eliminar el módulo `blog/utils/i18n.py` y cualquier importación asociada.
- Confirmar que la aplicación sigue arrancando y que los endpoints responden antes de continuar con fases posteriores.
