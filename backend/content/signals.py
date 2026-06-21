"""Event-driven nudge for the DB → fallback sync.

The daily launchd job (scripts/launchd/sync-content.sh) keeps the committed
offline fallback fresh, but content edited through the admin/API should reach
the Vercel-hosted frontend sooner than "tomorrow at 06:45". On any content or
Q&A change we touch a trigger file; a host-side launchd WatchPaths job
(com.wenxiao.content-sync-watch.plist) watches that file and runs the same sync
script. Django (in the API container) never git-pushes itself — it only signals.

The trigger dir is a bind mount (docker-compose.yml) so the host watcher sees
the touch. Writing is best-effort: a failed touch must never break a save.
"""

import os
from pathlib import Path

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone

from content.models import (
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)
from content.models import BlogPost
from qa.models import Comment

# Default matches the container mount in docker-compose.yml; overridable so the
# same code runs in dev/CI where no watcher exists (the touch is then a no-op
# write into a tmp dir).
_TRIGGER_DIR = Path(os.environ.get("CONTENT_SYNC_TRIGGER_DIR", "/sync-trigger"))
_TRIGGER_FILE = _TRIGGER_DIR / "content.dirty"

_WATCHED = (
    Profile,
    NewsItem,
    EducationItem,
    ExperienceItem,
    SkillGroup,
    Project,
    BlogPost,
    Comment,
)


@receiver(post_save)
@receiver(post_delete)
def _nudge_sync(sender, **kwargs):
    if sender not in _WATCHED:
        return
    try:
        _TRIGGER_DIR.mkdir(parents=True, exist_ok=True)
        # Content changes the file every time so WatchPaths always fires.
        _TRIGGER_FILE.write_text(timezone.now().isoformat())
    except OSError:
        # No mounted trigger dir (dev/CI) or a transient FS error — the daily
        # job still covers the snapshot; never let this break the write.
        pass
