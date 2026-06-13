from django.conf import settings
from django.db import models


class Comment(models.Model):
    """One Q&A board entry. Top-level comments are questions/messages;
    rows with `parent` set are replies (one level deep — the API flattens
    anything deeper onto the top-level thread).

    Either `author` (registered) or `guest_name` (anonymous visitor)
    identifies the writer. `author` survives user deletion as NULL so the
    thread keeps reading sensibly.
    """

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="qa_comments",
    )
    guest_name = models.CharField(max_length=80, blank=True, default="")
    body = models.TextField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    @property
    def display_name(self) -> str:
        if self.author_id and self.author:
            return self.author.username
        return self.guest_name or "Anonymous"

    @property
    def is_owner_post(self) -> bool:
        return bool(self.author_id and self.author and self.author.is_superuser)

    def __str__(self) -> str:  # pragma: no cover - admin readability only
        return f"{self.display_name}: {self.body[:40]}"
