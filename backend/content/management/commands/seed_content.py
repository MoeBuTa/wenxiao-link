"""Bootstrap the DB from the committed fallback JSON (frontend/content/*.json).

One-time-ish: by default it only fills *empty* tables / a blank profile, so it
never clobbers content already edited via the admin or API. Use --force to
flush and reload. Counterpart to ``export_content`` (the reverse direction).

    python manage.py seed_content                  # from <repo>/frontend/content
    python manage.py seed_content --input-dir DIR
    cat content-map.json | python manage.py seed_content --stdin   # for docker exec -i
"""

import json
import sys
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from content.fallback import FILES, default_content_dir, load_content


class Command(BaseCommand):
    help = "Seed the DB from the committed fallback JSON (frontend/content/*.json)."

    def add_arguments(self, parser):
        parser.add_argument("--input-dir", default=None,
                            help="Directory holding profile.json/news.json/projects.json "
                                 "(default: <repo>/frontend/content).")
        parser.add_argument("--stdin", action="store_true",
                            help="Read a single JSON map {filename: content} from stdin instead of files.")
        parser.add_argument("--force", action="store_true",
                            help="Replace existing rows (flush + reload). Default only fills empty tables.")

    def handle(self, *args, **opts):
        if opts["stdin"]:
            try:
                data = json.load(sys.stdin)
            except json.JSONDecodeError as exc:
                raise CommandError(f"Invalid JSON on stdin: {exc}")
        else:
            data = self._read_dir(opts["input_dir"])

        counts = load_content(data, replace=opts["force"])
        for section, n in counts.items():
            if n is None:
                self.stdout.write(f"  {section}: skipped (already populated; use --force to replace)")
            else:
                self.stdout.write(f"  {section}: {n} loaded")
        self.stdout.write(self.style.SUCCESS("seed_content done"))

    def _read_dir(self, input_dir):
        base = default_content_dir() if input_dir is None else Path(input_dir)
        data = {}
        for name in FILES:
            path = base / name
            if path.exists():
                data[name] = json.loads(path.read_text(encoding="utf-8"))
        if not data:
            raise CommandError(f"No content JSON found in {base}")
        return data
