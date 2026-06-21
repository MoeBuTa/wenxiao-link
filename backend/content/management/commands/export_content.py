"""Write the committed offline fallback snapshot from the DB.

Run periodically (see scripts/launchd/sync-content.sh) so the frontend's
offline fallback stays a current snapshot of the live content. Counterpart to
``seed_content`` (the reverse direction, profile/news/projects only).

The snapshot now spans every read-only feature so a Vercel-hosted frontend can
render a complete site when the backend is unreachable:

  - content/{profile,news,projects}.json   home page (server-read)
  - content/publications.seed.json          publications (server-read)
  - content/blog/<slug>.md                  blog posts (server-read)
  - public/fallback/stats.json              view counters (client-read)
  - public/fallback/qa.json                 Q&A board, read-only (client-read)

    python manage.py export_content                 # write into <repo>/frontend
    python manage.py export_content --output-dir DIR # treat DIR as the frontend root
    python manage.py export_content --to-stdout      # for docker exec piping to the host
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand

from content.fallback import default_frontend_dir, dump_all_fallbacks


def _write(base: Path, relpath: str, content) -> Path:
    """Write one snapshot entry under ``base``; .md is raw, .json is pretty JSON."""
    dest = base / relpath
    dest.parent.mkdir(parents=True, exist_ok=True)
    if relpath.endswith(".md"):
        text = content if str(content).endswith("\n") else f"{content}\n"
        dest.write_text(text, encoding="utf-8")
    else:
        dest.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return dest


class Command(BaseCommand):
    help = "Write the committed offline fallback snapshot (frontend/) from the DB."

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", default=None,
                            help="Frontend root to write into (default: <repo>/frontend).")
        parser.add_argument("--to-stdout", action="store_true",
                            help="Print the JSON map {relpath: content} to stdout instead of writing files.")

    def handle(self, *args, **opts):
        payloads = dump_all_fallbacks()

        if opts["to_stdout"]:
            self.stdout.write(json.dumps(payloads, ensure_ascii=False, indent=2))
            return

        base = default_frontend_dir() if opts["output_dir"] is None else Path(opts["output_dir"])
        for relpath, content in payloads.items():
            self.stdout.write(f"  wrote {_write(base, relpath, content)}")
        self.stdout.write(self.style.SUCCESS("export_content done"))
