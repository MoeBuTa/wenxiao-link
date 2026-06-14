"""
Django settings for the wenxiao.link personal-site API.

Env-driven secrets, cookie-JWT auth, whitenoise static serving, Postgres
via docker compose.
"""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

JWT_SECRET = os.environ.get("JWT_SECRET", "django-insecure-change-me-please-set-JWT_SECRET")
SECRET_KEY = JWT_SECRET

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

DEBUG = os.environ.get("PROD_ENV", "False") != "True"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "authenticate",
    "content",
    "core",
    "qa",
    "scholar",
    "stats",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "api.urls"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "authenticate.authentication.CookieJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Guests can post Q&A comments — keep drive-by spam bounded.
        "qa-write": "20/hour",
        "auth-write": "20/hour",
        # Page-view pings: generous for a real reader, bounds scripted inflation.
        "stats-write": "120/hour",
    },
    # Behind cloudflared, Cloudflare appends the real client IP as the LAST
    # X-Forwarded-For entry. Trust exactly one hop so throttle identity is
    # that IP, not the whole attacker-prependable XFF string.
    "NUM_PROXIES": 1,
}

SIMPLE_JWT = {
    # The cookie is the session: long-lived access token, no refresh dance.
    "ACCESS_TOKEN_LIFETIME": timedelta(days=30),
    "SIGNING_KEY": JWT_SECRET,
    "ALGORITHM": "HS256",
}

# Auth cookie (httpOnly JWT).
WENXIAO_AUTH_COOKIE_NAME = "wenxiao_access"
WENXIAO_AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
WENXIAO_AUTH_COOKIE_SECURE = not DEBUG
# Path routing makes the API same-origin with the site, so Lax is enough
# (and doubles as the CSRF guard for the cookie-JWT writes).
WENXIAO_AUTH_COOKIE_SAMESITE = "Lax"
WENXIAO_AUTH_COOKIE_DOMAIN = None

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "api.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "wenxiao"),
        "USER": os.environ.get("DB_USER", "wenxiao"),
        "PASSWORD": os.environ.get("DB_PASS", "wenxiao"),
        "HOST": os.environ.get("DB_SERVICE", "localhost"),
        "PORT": os.environ.get("DB_PORT", 5432),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Australia/Perth"
USE_I18N = True
USE_TZ = True

# Everything Django-served must live under /api/ — cloudflared routes
# `wenxiao.link/api/*` to this container and everything else to Next.js,
# so a bare /static/ would never reach us in production.
STATIC_URL = "/api/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    # Production is same-origin via cloudflared path routing; these cover
    # local `next dev` (3000) and direct pm2-bundle access (8890).
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8890",
    "http://127.0.0.1:8890",
    "https://wenxiao.link",
]

CSRF_TRUSTED_ORIGINS = [
    "https://wenxiao.link",
    "http://localhost:8890",
    "http://127.0.0.1:8890",
    "http://localhost:8002",
    "http://127.0.0.1:8002",
]

# Google Scholar profile the publications section mirrors.
SCHOLAR_USER_ID = os.environ.get("SCHOLAR_USER_ID", "Yf6xHJ4AAAAJ")
