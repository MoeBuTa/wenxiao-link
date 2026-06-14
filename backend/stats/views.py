"""Public, privacy-friendly view-count endpoints.

- POST /api/stats/hit/        record a page view (fire-and-forget from the browser)
- GET  /api/stats/summary/    {totalViews, todayViews, uniqueVisitors}
- GET  /api/stats/blog/       {"<slug>": views, ...}

No cookies are set and no PII is stored — unique visitors are a salted hash of
IP + user agent. The owner's own visits are not counted.
"""

import hashlib
import re

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F, Sum
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from stats.models import SITE_PATH, PageViewDay, UniqueVisitor

# Slug length is bounded so "/blog/<slug>" can never overflow the path column.
_BLOG_RE = re.compile(r"^/blog/([a-zA-Z0-9_-]{1,200})/?$")


def _client_ip(request) -> str:
    # Cloudflare/cloudflared appends the real client IP as the LAST X-Forwarded-For
    # entry (NUM_PROXIES=1); fall back to REMOTE_ADDR.
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[-1].strip()
    return request.META.get("REMOTE_ADDR", "") or ""


def _visitor_hash(request) -> str:
    raw = f"{settings.SECRET_KEY}|{_client_ip(request)}|{request.META.get('HTTP_USER_AGENT', '')}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _bump(path: str, day) -> None:
    """Atomically +1 the (path, day) tally, creating the row on first hit."""
    updated = PageViewDay.objects.filter(path=path, day=day).update(views=F("views") + 1)
    if updated:
        return
    try:
        with transaction.atomic():
            PageViewDay.objects.create(path=path, day=day, views=1)
    except IntegrityError:  # racing first hit created it — just increment.
        PageViewDay.objects.filter(path=path, day=day).update(views=F("views") + 1)


class HitView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "stats-write"

    def post(self, request):
        # Don't count the site owner browsing their own pages.
        user = request.user
        if user.is_authenticated and user.is_superuser:
            return Response(status=204)

        data = request.data if isinstance(request.data, dict) else {}
        path = str(data.get("path") or "/").strip()
        day = timezone.localdate()
        _bump(SITE_PATH, day)
        m = _BLOG_RE.match(path)
        if m:
            _bump(f"/blog/{m.group(1)}", day)

        UniqueVisitor.objects.get_or_create(visitor=_visitor_hash(request))
        return Response(status=204)


class SummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        site = PageViewDay.objects.filter(path=SITE_PATH)
        total = site.aggregate(s=Sum("views"))["s"] or 0
        today = site.filter(day=timezone.localdate()).aggregate(s=Sum("views"))["s"] or 0
        return Response(
            {
                "totalViews": total,
                "todayViews": today,
                "uniqueVisitors": UniqueVisitor.objects.count(),
            }
        )


class BlogStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rows = (
            PageViewDay.objects.filter(path__startswith="/blog/")
            .values("path")
            .annotate(v=Sum("views"))
        )
        prefix = len("/blog/")
        return Response({r["path"][prefix:]: r["v"] for r in rows})
