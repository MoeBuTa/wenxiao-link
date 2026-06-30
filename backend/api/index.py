"""Vercel serverless entrypoint.

The @vercel/python builder serves the WSGI callable exposed here as `app`.
Reuses the same application object as gunicorn/docker (api.wsgi) so there is
one code path for both runtimes.
"""

from api.wsgi import application as app  # noqa: F401
