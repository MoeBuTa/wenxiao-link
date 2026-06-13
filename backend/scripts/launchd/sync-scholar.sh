#!/bin/bash
# Daily Google Scholar -> Postgres sync, run inside the live API container.
# Targets the container by name so it works no matter where the compose
# project was brought up from (runner workspace or a manual checkout).
set -euo pipefail

echo "[scholar-sync] $(date '+%Y-%m-%d %H:%M:%S') starting"
docker exec wenxiao-api python manage.py sync_scholar
echo "[scholar-sync] $(date '+%Y-%m-%d %H:%M:%S') done"
