"""ASGI config for the wenxiao.link API."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

application = get_asgi_application()
