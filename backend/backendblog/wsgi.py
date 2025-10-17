"""
WSGI config for backendblog project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
from pathlib import Path

from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backendblog.settings")

application = get_wsgi_application()

BASE_DIR = Path(__file__).resolve().parent.parent
application = WhiteNoise(application, root=str(BASE_DIR / "staticfiles"))
