"""camelCase wire serializers for the editable site content.

Field names mirror the frontend TypeScript types (app/lib/types.ts) so the
JSON the API emits drops straight into the existing components.
"""

from rest_framework import serializers

from content.models import (
    BlogPost,
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)


class ProfileSerializer(serializers.ModelSerializer):
    researchDirection = serializers.CharField(source="research_direction", allow_blank=True, required=False)
    # `summary` is stored as blank-line-separated paragraphs; expose both the
    # raw text (for editing) and a split array (for rendering).
    summaryText = serializers.CharField(source="summary", allow_blank=True, required=False)
    summary = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "name",
            "title",
            "affiliation",
            "email",
            "researchDirection",
            "summary",
            "summaryText",
            "interests",
            "links",
        ]

    def get_summary(self, obj) -> list:
        return [p.strip() for p in obj.summary.split("\n\n") if p.strip()]

    def get_links(self, obj) -> dict:
        return {
            "github": obj.link_github,
            "linkedin": obj.link_linkedin,
            "scholar": obj.link_scholar,
            "cv": obj.link_cv or "/cv.pdf",
        }


class ProfileUpdateSerializer(serializers.Serializer):
    """Admin PATCH — only supplied keys are touched."""

    name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    affiliation = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    researchDirection = serializers.CharField(required=False, allow_blank=True)
    summaryText = serializers.CharField(required=False, allow_blank=True)
    interests = serializers.ListField(child=serializers.CharField(), required=False)
    links = serializers.DictField(required=False)

    def update(self, instance: Profile, data: dict) -> Profile:
        field_map = {
            "name": "name",
            "title": "title",
            "affiliation": "affiliation",
            "email": "email",
            "researchDirection": "research_direction",
            "summaryText": "summary",
            "interests": "interests",
        }
        for wire, model_field in field_map.items():
            if wire in data:
                setattr(instance, model_field, data[wire])
        links = data.get("links")
        if isinstance(links, dict):
            if "github" in links:
                instance.link_github = links["github"] or ""
            if "linkedin" in links:
                instance.link_linkedin = links["linkedin"] or ""
            if "scholar" in links:
                instance.link_scholar = links["scholar"] or ""
            if "cv" in links:
                instance.link_cv = links["cv"] or "/cv.pdf"
        instance.save()
        return instance


class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = ["id", "date", "text", "order"]


class EducationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationItem
        fields = ["id", "institution", "degree", "period", "detail", "order"]


class ExperienceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceItem
        fields = ["id", "org", "role", "period", "detail", "order"]


class SkillGroupSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = SkillGroup
        fields = ["id", "group", "items", "order"]


class ProjectSerializer(serializers.ModelSerializer):
    repoUrl = serializers.URLField(source="repo_url", allow_blank=True, required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "tags", "repoUrl", "stars", "highlight", "order"]


class BlogPostListSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = BlogPost
        fields = ["id", "slug", "title", "date", "summary", "tags", "published"]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = BlogPost
        fields = ["id", "slug", "title", "date", "summary", "tags", "body", "published"]
