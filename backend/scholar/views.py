import hmac
import os

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from authenticate.permissions import IsSuperUser
from scholar.models import Publication, ScholarProfile


def _profile_payload(profile: ScholarProfile | None) -> dict:
    if profile is None:
        return {
            "userId": settings.SCHOLAR_USER_ID,
            "name": "",
            "affiliation": "",
            "avatarUrl": "",
            "citationsAll": 0,
            "hIndexAll": 0,
            "i10IndexAll": 0,
            "citationsByYear": {},
            "syncedAt": None,
        }
    return {
        "userId": profile.user_id,
        "name": profile.name,
        "affiliation": profile.affiliation,
        "avatarUrl": profile.avatar_url,
        "citationsAll": profile.citations_all,
        "hIndexAll": profile.h_index_all,
        "i10IndexAll": profile.i10_index_all,
        "citationsByYear": profile.citations_by_year or {},
        "syncedAt": profile.synced_at.isoformat() if profile.synced_at else None,
    }


def _publication_payload(pub: Publication) -> dict:
    return {
        "id": pub.id,
        "scholarId": pub.scholar_id,
        "title": pub.title,
        "authors": pub.authors,
        "venue": pub.venue,
        "year": pub.year,
        "citedBy": pub.cited_by,
        "citedByUrl": pub.cited_by_url,
        "url": pub.url,
        "coreRank": pub.core_rank,
        "coreAcronym": pub.core_acronym,
    }


class PublicationListView(APIView):
    """GET /api/scholar/publications/ — public; powers the home page."""

    permission_classes = [AllowAny]

    def get(self, request):
        profile = ScholarProfile.objects.filter(user_id=settings.SCHOLAR_USER_ID).first()
        publications = Publication.objects.all()
        return Response(
            {
                "profile": _profile_payload(profile),
                "publications": [_publication_payload(p) for p in publications],
            }
        )


class RefreshView(APIView):
    """POST /api/scholar/refresh/ — owner-triggered on-demand re-sync."""

    permission_classes = [IsSuperUser]

    def post(self, request):
        try:
            call_command("sync_scholar")
        except CommandError as exc:
            return Response({"detail": str(exc)}, status=502)
        except Exception as exc:  # noqa: BLE001 — surface as a gateway error, not a 500
            return Response({"detail": f"Sync failed: {exc}"}, status=502)
        return Response(
            {
                "ok": True,
                "count": Publication.objects.count(),
            }
        )


class CronSyncView(APIView):
    """GET /api/scholar/cron-sync/ — Vercel Cron entry point.

    Replaces the launchd job that ran `sync_scholar` daily on the Mac. Vercel
    Cron sends `Authorization: Bearer $CRON_SECRET`; we accept the request only
    when that matches, so the endpoint is public-routable but not callable by
    anyone without the secret. GET (not POST) because Vercel Cron issues GETs.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        secret = os.environ.get("CRON_SECRET", "")
        header = request.headers.get("Authorization", "")
        expected = f"Bearer {secret}"
        # Constant-time compare; reject when no secret is configured at all.
        if not secret or not hmac.compare_digest(header, expected):
            return Response({"detail": "unauthorized"}, status=401)
        try:
            call_command("sync_scholar")
        except CommandError as exc:
            return Response({"detail": str(exc)}, status=502)
        except Exception as exc:  # noqa: BLE001 — gateway error, not a 500
            return Response({"detail": f"Sync failed: {exc}"}, status=502)
        return Response({"ok": True, "count": Publication.objects.count()})
