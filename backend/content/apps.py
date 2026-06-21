from django.apps import AppConfig


class ContentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "content"

    def ready(self):
        # Wire up the post_save/post_delete receivers that nudge the
        # DB → fallback sync (see content/signals.py).
        from content import signals  # noqa: F401
