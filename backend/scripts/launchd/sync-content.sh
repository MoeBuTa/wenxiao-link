#!/bin/bash
# Periodic + event-driven DB -> committed fallback sync. Regenerates the full
# offline fallback snapshot from the live DB so the (Vercel-hosted) frontend can
# render a complete site when the backend is unreachable, then commits + pushes
# if anything changed (the path-diff deploy / Vercel rebuilds with it):
#
#   frontend/content/{profile,news,projects}.json   home page    (server-read)
#   frontend/content/publications.seed.json          publications (server-read)
#   frontend/content/blog/<slug>.md                  blog posts   (server-read)
#   frontend/public/fallback/stats.json              view counters (client-read)
#   frontend/public/fallback/qa.json                 Q&A board     (client-read)
#
# The export runs inside the API container (it owns the DB connection) and
# prints a {relpath: content} JSON map on stdout; the host writes the files into
# a DEDICATED repo checkout used only by this job — never the GitHub Actions
# runner workspace (committing there races CI). The script hard-fails if
# WENXIAO_REPO is the runner workspace, isn't a checkout, or isn't on the
# expected branch. Run by the daily launchd job and the event-driven watch job.
set -euo pipefail

REPO="${WENXIAO_REPO:-/Users/wenxiao/wenxiao-link-content-sync}"
BRANCH="${WENXIAO_BRANCH:-main}"
FRONTEND="$REPO/frontend"
# Repo-relative paths this job owns and may stage/commit. The export writes the
# whole snapshot under frontend/; we only ever touch these.
OWNED=(
  frontend/content/profile.json
  frontend/content/news.json
  frontend/content/projects.json
  frontend/content/publications.seed.json
  frontend/content/blog
  frontend/public/fallback
)

# Single-flight: the daily job and the event-driven watch job share this script.
# launchd serialises a single label, but the two labels can overlap — the lock
# makes a concurrent run exit cleanly (the holder exports the latest DB state
# anyway, so the change is not lost).
LOCK="/tmp/wenxiao-content-sync.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "[content-sync] another run holds the lock; exiting"
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

# Coalesce a burst of edit triggers into a single run.
sleep 2

echo "[content-sync] $(date '+%Y-%m-%d %H:%M:%S') starting"

case "$REPO" in
  */actions-runner-*/_work/*)
    echo "[content-sync] ERROR: WENXIAO_REPO is the CI runner workspace ($REPO); use a dedicated checkout." >&2
    exit 1 ;;
esac
[ -d "$REPO/.git" ] || { echo "[content-sync] ERROR: $REPO is not a git checkout." >&2; exit 1; }

cd "$REPO"
cur_branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$cur_branch" = "$BRANCH" ] || {
  echo "[content-sync] ERROR: HEAD is '$cur_branch', expected '$BRANCH' (detached?)." >&2; exit 1; }

# Start each run current with origin so commits fast-forward; this also rebases
# any commit a previous run committed but failed to push.
git pull --rebase --autostash origin "$BRANCH"

# git add -A below needs these to exist even when the export omits them (no
# published posts yet, or a never-synced public/fallback).
mkdir -p "$FRONTEND/content/blog" "$FRONTEND/public/fallback"

# Export from the live container, write the snapshot on the host. The data is
# passed as a file-path arg (not stdin) because `python3 -` reads its program
# from stdin (the heredoc). Keys are paths relative to frontend/; .md values are
# raw markdown, .json values are objects.
tmp="$(mktemp)"
docker exec wenxiao-api python manage.py export_content --to-stdout > "$tmp"
python3 - "$FRONTEND" "$tmp" <<'PY'
import json, os, sys
root, src = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding="utf-8"))
for rel, content in data.items():
    dest = os.path.join(root, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        if rel.endswith(".md"):
            f.write(content if content.endswith("\n") else content + "\n")
        else:
            json.dump(content, f, ensure_ascii=False, indent=2)
            f.write("\n")
PY
rm -f "$tmp"

# Safety guard (mirrors sync_scholar's 0-rows guard): never publish a blank
# profile — that signals an unseeded/broken DB, not real content.
name="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("name",""))' "$FRONTEND/content/profile.json")"
[ -n "$name" ] || { echo "[content-sync] ERROR: exported profile name is blank; refusing to commit." >&2; exit 1; }

# Stage only the paths this job owns. -A captures deletions too (e.g. a blog
# post unpublished/removed in the DB drops its .md file).
git add -A -- "${OWNED[@]}"
if ! git diff --cached --quiet -- "${OWNED[@]}"; then
  git -c user.name="content-sync" -c user.email="noreply@wenxiao.link" \
    commit -m "chore(content): sync offline fallback from DB"
  echo "[content-sync] committed"
fi

# Push when ahead of origin — covers both a fresh commit and one a previous run
# committed but failed to push (so a transient push failure self-heals).
if [ "$(git rev-list --count "origin/$BRANCH..HEAD")" -gt 0 ]; then
  git push origin "$BRANCH"
  echo "[content-sync] pushed updated fallback"
else
  echo "[content-sync] no changes to push"
fi

echo "[content-sync] $(date '+%Y-%m-%d %H:%M:%S') done"
