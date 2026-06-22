from django.db import models


class ScholarProfile(models.Model):
    """Singleton-ish mirror of the Google Scholar profile header + metrics."""

    user_id = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=120, blank=True, default="")
    affiliation = models.CharField(max_length=255, blank=True, default="")
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    citations_all = models.IntegerField(default=0)
    h_index_all = models.IntegerField(default=0)
    i10_index_all = models.IntegerField(default=0)
    # {"2021": 25, "2022": 40, ...} — citations *received* per calendar year,
    # scraped from the profile's "Cited by" histogram. Scholar only exposes a
    # rolling recent window (~6 years). Optional: stays {} if parsing finds
    # nothing, so a markup change never blocks the rest of the sync.
    citations_by_year = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:  # pragma: no cover - admin readability only
        return f"{self.name} ({self.user_id})"


class Publication(models.Model):
    """One row per Google Scholar publication, annotated with its CORE rank.

    `scholar_id` is Scholar's citation_for_view key — the stable upsert
    handle across syncs.
    """

    scholar_id = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=500)
    authors = models.CharField(max_length=500, blank=True, default="")
    venue = models.CharField(max_length=500, blank=True, default="")
    year = models.IntegerField(null=True, blank=True)
    cited_by = models.IntegerField(default=0)
    cited_by_url = models.URLField(max_length=500, blank=True, default="")
    url = models.URLField(max_length=500, blank=True, default="")
    core_rank = models.CharField(max_length=16, blank=True, default="")
    core_acronym = models.CharField(max_length=32, blank=True, default="")
    order_index = models.IntegerField(default=0)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-year", "-cited_by", "order_index"]

    def __str__(self) -> str:  # pragma: no cover - admin readability only
        return self.title[:60]
