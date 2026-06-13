from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from scholar.models import Publication, ScholarProfile
from scholar.sync import ScholarFetchError, fetch_scholar


def _upsert(pub: dict, now) -> None:
    Publication.objects.update_or_create(
        scholar_id=pub["scholar_id"],
        defaults={
            "title": pub["title"][:500],
            "authors": pub["authors"][:500],
            "venue": pub["venue"][:500],
            "year": pub["year"],
            "cited_by": pub["cited_by"],
            "cited_by_url": pub["cited_by_url"][:500],
            "url": pub["url"][:500],
            "core_rank": pub["core_rank"],
            "core_acronym": pub["core_acronym"],
            "order_index": pub["order_index"],
            "synced_at": now,
        },
    )


class Command(BaseCommand):
    help = "Mirror the Google Scholar profile into Postgres (publications + metrics)."

    def handle(self, *args, **options):
        user_id = settings.SCHOLAR_USER_ID
        try:
            data = fetch_scholar(user_id)
        except ScholarFetchError as exc:
            raise CommandError(str(exc)) from exc

        now = timezone.now()
        profile = data["profile"]
        publications = data["publications"]

        if not publications:
            # A parse that finds zero rows is far more likely a Google markup
            # change than a genuinely empty profile — keep the existing data.
            raise CommandError("Parsed 0 publications; refusing to wipe existing rows.")

        with transaction.atomic():
            ScholarProfile.objects.update_or_create(
                user_id=user_id,
                defaults={
                    "name": profile["name"],
                    "affiliation": profile["affiliation"],
                    "avatar_url": profile["avatar_url"],
                    "citations_all": profile["citations_all"],
                    "h_index_all": profile["h_index_all"],
                    "i10_index_all": profile["i10_index_all"],
                    "synced_at": now,
                },
            )

            seen_ids = []
            for pub in publications:
                if not pub["scholar_id"]:
                    continue
                seen_ids.append(pub["scholar_id"])
                _upsert(pub, now)

            if not seen_ids:
                # Rows parsed but no citation_for_view ids extracted — that is
                # a markup change, and the stale-delete below would wipe the
                # whole table. Raising rolls the transaction back instead.
                raise CommandError(
                    "Parsed publications but extracted 0 scholar ids; aborting sync."
                )

            stale = Publication.objects.exclude(scholar_id__in=seen_ids)
            removed = stale.count()
            stale.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"[scholar] synced {len(seen_ids)} publications "
                f"({removed} stale removed), citations={profile['citations_all']}, "
                f"h-index={profile['h_index_all']}"
            )
        )
