#!/bin/bash
# Docker entrypoint script.
set -e

until PGPASSWORD=$DB_PASS psql -h "$DB_SERVICE" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"

python manage.py migrate
python manage.py collectstatic --noinput

# Seed the admin user only when the auth_user table is empty (fresh database).
python manage.py shell <<'PYEOF'
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ.get("ADMIN_USERNAME", "admin")
password = os.environ.get("ADMIN_PASSWORD", "")

if not password:
    print("[entrypoint] ADMIN_PASSWORD is not set; skipping admin bootstrap.")
elif User.objects.exists():
    print(f"[entrypoint] Users already exist ({User.objects.count()}); skipping admin bootstrap.")
else:
    User.objects.create_superuser(username=username, email=f"{username}@local.test", password=password)
    print(f"[entrypoint] Created superuser '{username}'.")
PYEOF

# First-boot Scholar sync: populate publications when the table is empty.
# Network failures must not block boot — the daily launchd job and the
# admin-triggered /api/scholar/refresh/ endpoint can both backfill later.
python manage.py shell <<'PYEOF'
from scholar.models import Publication
from django.core.management import call_command

if Publication.objects.exists():
    print(f"[entrypoint] {Publication.objects.count()} publications in DB; skipping initial sync.")
else:
    try:
        call_command("sync_scholar")
    except Exception as exc:  # noqa: BLE001 — boot must survive Scholar being unreachable
        print(f"[entrypoint] Initial scholar sync failed (will retry via cron): {exc}")
PYEOF

exec gunicorn api.wsgi:application --bind 0.0.0.0:8000 --workers 2 --access-logfile -
