from django.contrib import admin

from scholar.models import Publication, ScholarProfile


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "year", "core_rank", "cited_by", "venue", "synced_at")
    list_filter = ("core_rank", "year")
    search_fields = ("title", "venue", "authors")


@admin.register(ScholarProfile)
class ScholarProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "user_id", "citations_all", "h_index_all", "synced_at")
