from django.db import models

# Sentinel "path" for the whole-site total (every page view increments it).
# Blog posts are additionally counted under their own path "/blog/<slug>".
SITE_PATH = "__site__"


class PageViewDay(models.Model):
    """Per-path, per-day view tally. Summed for totals; one row per day keeps
    "today" cheap and bounds the table to (paths × days) rows."""

    path = models.CharField(max_length=220)  # SITE_PATH or "/blog/<slug>"
    day = models.DateField()
    views = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("path", "day")
        indexes = [models.Index(fields=["path"])]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.path} {self.day}: {self.views}"


class UniqueVisitor(models.Model):
    """One row per distinct visitor, identified by a salted hash of IP + UA.
    No IP, no user agent, and no cookie is stored — only the hash."""

    visitor = models.CharField(max_length=64, unique=True)
    first_seen = models.DateField(auto_now_add=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.visitor[:12]
