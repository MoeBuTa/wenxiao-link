"""Write the committed fallback JSON (frontend/content/*.json) from the DB.

Run periodically (see scripts/launchd/sync-content.sh) so the frontend's
offline fallback stays a current snapshot of the live content. Counterpart to
``seed_content`` (the reverse direction). The blog is excluded — it is DB-only.

    python manage.py export_content                 # write <repo>/frontend/content
    python manage.py export_content --output-dir DIR
    python manage.py export_content --to-stdout      # for docker exec piping to the host
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand

from content.fallback import default_content_dir, dump_content


class Command(BaseCommand):
    help = "Write the committed fallback JSON (frontend/content/*.json) from the DB."

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", default=None,
                            help="Directory to write into (default: <repo>/frontend/content).")
        parser.add_argument("--to-stdout", action="store_true",
                            help="Print the JSON map {filename: content} to stdout instead of writing files.")

    def handle(self, *args, **opts):
        payloads = dump_content()

        if opts["to_stdout"]:
            self.stdout.write(json.dumps(payloads, ensure_ascii=False, indent=2))
            return

        base = default_content_dir() if opts["output_dir"] is None else Path(opts["output_dir"])
        base.mkdir(parents=True, exist_ok=True)
        for name, content in payloads.items():
            (base / name).write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            self.stdout.write(f"  wrote {base / name}")
        self.stdout.write(self.style.SUCCESS("export_content done"))
