#!/bin/bash
# Periodic DB -> committed fallback JSON sync. Regenerates
# frontend/content/{profile,news,projects}.json from the live DB so the
# frontend's offline fallback stays a current snapshot, then commits + pushes
# if anything changed (the path-diff deploy rebuilds the frontend with it).
#
# The export runs inside the API container (it owns the DB connection) and
# prints a {filename: content} JSON map on stdout; the host writes the files
# into a DEDICATED repo checkout used only by this job — never the GitHub
# Actions runner workspace (committing there races CI). The script hard-fails
# if WENXIAO_REPO is the runner workspace, isn't a checkout, or isn't on the
# expected branch.
set -euo pipefail

REPO="${WENXIAO_REPO:-/Users/wenxiao/wenxiao-link-content-sync}"
BRANCH="${WENXIAO_BRANCH:-main}"
CONTENT="$REPO/frontend/content"
FILES=(profile.json news.json projects.json)

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

# Export from the live container, write the files on the host. The data is
# passed as a file-path arg (not stdin) because `python3 -` reads its program
# from stdin (the heredoc).
tmp="$(mktemp)"
docker exec wenxiao-api python manage.py export_content --to-stdout > "$tmp"
python3 - "$CONTENT" "$tmp" <<'PY'
import json, os, sys
out, src = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding="utf-8"))
for name, content in data.items():
    with open(os.path.join(out, name), "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")
PY
rm -f "$tmp"

# Safety guard (mirrors sync_scholar's 0-rows guard): never publish a blank
# profile — that signals an unseeded/broken DB, not real content.
name="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("name",""))' "$CONTENT/profile.json")"
[ -n "$name" ] || { echo "[content-sync] ERROR: exported profile name is blank; refusing to commit." >&2; exit 1; }

# Stage only the files this job owns (not the rest of frontend/content).
owned=(); for f in "${FILES[@]}"; do owned+=("frontend/content/$f"); done
if ! git diff --quiet -- "${owned[@]}"; then
  git add "${owned[@]}"
  git -c user.name="content-sync" -c user.email="noreply@wenxiao.link" \
    commit -m "chore(content): sync fallback JSON from DB"
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
