from django.db import models


class Profile(models.Model):
    """Singleton (pk=1) holding the home-page identity + about content."""

    name = models.CharField(max_length=120, default="")
    title = models.CharField(max_length=255, default="")
    affiliation = models.CharField(max_length=255, default="")
    email = models.EmailField(blank=True, default="")
    research_direction = models.TextField(blank=True, default="")
    # Paragraphs separated by a blank line.
    summary = models.TextField(blank=True, default="")
    interests = models.JSONField(default=list)  # list[str]
    link_github = models.URLField(blank=True, default="")
    link_linkedin = models.URLField(blank=True, default="")
    link_scholar = models.URLField(blank=True, default="")
    link_cv = models.CharField(max_length=255, blank=True, default="/cv.pdf")

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls) -> "Profile":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self) -> str:  # pragma: no cover - admin readability
        return self.name or "Profile"


class NewsItem(models.Model):
    date = models.CharField(max_length=20)  # "YYYY-MM"
    text = models.TextField()  # markdown with inline [text](url) links
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["-date", "order", "-id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.date}: {self.text[:40]}"


class EducationItem(models.Model):
    institution = models.CharField(max_length=200)
    degree = models.CharField(max_length=200)
    period = models.CharField(max_length=100, blank=True, default="")
    detail = models.CharField(max_length=300, blank=True, default="")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.degree} — {self.institution}"


class ExperienceItem(models.Model):
    org = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    period = models.CharField(max_length=100, blank=True, default="")
    detail = models.TextField(blank=True, default="")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.role} — {self.org}"


class SkillGroup(models.Model):
    group = models.CharField(max_length=120)
    items = models.JSONField(default=list)  # list[str]
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return self.group


class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    tags = models.JSONField(default=list)  # list[str]
    repo_url = models.URLField(blank=True, default="")
    stars = models.IntegerField(null=True, blank=True)
    highlight = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class BlogPost(models.Model):
    slug = models.SlugField(max_length=200, unique=True)
    title = models.CharField(max_length=300)
    date = models.CharField(max_length=20, blank=True, default="")  # "YYYY-MM-DD"
    summary = models.TextField(blank=True, default="")
    tags = models.JSONField(default=list)  # list[str]
    body = models.TextField(blank=True, default="")  # markdown
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self) -> str:  # pragma: no cover
        return self.title
