from django.contrib import admin

from qa.models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "display_name", "body", "parent", "created_at", "is_edited")
    list_filter = ("is_edited", "created_at")
    search_fields = ("body", "guest_name", "author__username")
