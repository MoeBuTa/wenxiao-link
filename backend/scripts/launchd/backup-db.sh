#!/usr/bin/env bash
# Daily Postgres backup for the site database.
#
# Run by the com.wenxiao.backup-db launchd job (daily, low-traffic hour).
# Dumps the live Postgres database in pg_dump custom format to a
# date-stamped file, validates it, and prunes old dumps. Date-stamped (not
# a single rolling file) so a bad day's data can still be recovered from an
# earlier dump.
#
# Targets the DB container by name so it works regardless of where the
# compose project was brought up from. Reads WENXIAO_DATA_ROOT for the
# backup destination (set in the launchd plist / deploy env) so this script
# carries no machine-specific absolute paths.
#
# Restore (replace the live DB from a dump):
#   docker exec -i wenxiao-db pg_restore --clean --if-exists -U wenxiao -d wenxiao \
#     < "$WENXIAO_DATA_ROOT/backups/wenxiao-YYYY-MM-DD.dump"
#
# Inspect a dump without restoring:
#   docker exec -i wenxiao-db pg_restore --list \
#     < "$WENXIAO_DATA_ROOT/backups/wenxiao-YYYY-MM-DD.dump"

set -euo pipefail

CONTAINER="wenxiao-db"
DB_USER="wenxiao"
DB_NAME="wenxiao"
RETENTION_DAYS=14
MIN_KEEP=7   # always retain at least this many recent dumps, regardless of age

: "${WENXIAO_DATA_ROOT:?WENXIAO_DATA_ROOT must be set (backup destination root)}"
BACKUP_DIR="$WENXIAO_DATA_ROOT/backups"

DATE="$(date '+%F')"
BACKUP_FILE="$BACKUP_DIR/wenxiao-$DATE.dump"
TMP="$BACKUP_FILE.tmp.$$"

mkdir -p "$BACKUP_DIR"
ts() { date '+%F %T'; }

echo ""
echo "[$(ts)] backup-db start"

if ! docker ps --filter "name=$CONTAINER" --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "[$(ts)] ERROR: $CONTAINER container not running; nothing to back up"
  exit 1
fi

# -Fc: compressed custom format pg_restore can restore selectively / in
# parallel. Write to a tmp file we control, then atomic-rename onto the
# dated path so a crash mid-dump never leaves a half-written backup.
if ! docker exec "$CONTAINER" pg_dump -U "$DB_USER" -Fc -d "$DB_NAME" > "$TMP"; then
  echo "[$(ts)] ERROR: pg_dump failed"
  rm -f "$TMP"
  exit 1
fi

SIZE=$(stat -f%z "$TMP")
if [ "$SIZE" -lt 4096 ]; then
  # A near-empty dump means something silently produced no rows. Refuse to
  # promote it so today's slot isn't filled with a junk file.
  echo "[$(ts)] ERROR: dump suspiciously small (${SIZE} bytes); not promoting"
  rm -f "$TMP"
  exit 1
fi

# Content sanity check. The size check above cannot catch a STRUCTURALLY
# valid dump of an empty-content DB: a fresh/empty database (now possible
# since the seed mechanism was removed) dumps its full schema, easily
# clearing the size floor, yet holds no real content. Promoting such a dump
# and then pruning by age could rotate out the last good backups. Refuse to
# promote when the core content tables are all empty. A failed/unavailable
# check (empty $ROWS) does NOT block the backup: the dump already succeeded.
ROWS=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT (SELECT count(*) FROM content_blogpost)
        + (SELECT count(*) FROM scholar_publication)
        + (SELECT count(*) FROM content_newsitem)" 2>/dev/null | tr -d '[:space:]' || true)
if [ "$ROWS" = "0" ]; then
  echo "[$(ts)] ERROR: DB has no content (blog+publications+news all empty); not promoting"
  rm -f "$TMP"
  exit 1
fi

mv -f "$TMP" "$BACKUP_FILE"
echo "[$(ts)] wrote $BACKUP_FILE (${SIZE}b, content rows=${ROWS:-unknown})"

# Prune dumps older than the retention window, but always keep at least
# MIN_KEEP of the most recent regardless of age, so a run of bad days can
# never leave us with zero backups. Filenames have no spaces, so word
# splitting on the ls listing is safe.
i=0
for old in $(ls -t "$BACKUP_DIR"/wenxiao-*.dump 2>/dev/null); do
  i=$((i + 1))
  [ "$i" -le "$MIN_KEEP" ] && continue
  if find "$old" -mtime +"$RETENTION_DAYS" -print 2>/dev/null | grep -q .; then
    rm -f "$old" && echo "[$(ts)] pruned $old"
  fi
done
echo "[$(ts)] backup-db done (retention ${RETENTION_DAYS}d, keep>=${MIN_KEEP})"
