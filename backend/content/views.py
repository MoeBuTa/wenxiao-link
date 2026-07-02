from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from content.markdown import parse_blog_markdown
from content.models import (
    AgentSkill,
    BlogPost,
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)
from content.permissions import ReadOnlyOrSuperUser
from content.serializers import (
    AgentSkillSerializer,
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    EducationItemSerializer,
    ExperienceItemSerializer,
    NewsItemSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ProjectSerializer,
    SkillGroupSerializer,
)


# ---- Profile (singleton) ----------------------------------------------------


class ProfileView(APIView):
    """GET public profile; PATCH (owner) to edit identity + about."""

    permission_classes = [ReadOnlyOrSuperUser]

    def get(self, request):
        return Response(ProfileSerializer(Profile.load()).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.update(Profile.load(), serializer.validated_data)
        return Response(ProfileSerializer(instance).data)


# ---- Aggregate for the home page -------------------------------------------


class SiteContentView(APIView):
    """One GET that returns everything the home page renders."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "profile": ProfileSerializer(Profile.load()).data,
                "news": NewsItemSerializer(NewsItem.objects.all(), many=True).data,
                "education": EducationItemSerializer(EducationItem.objects.all(), many=True).data,
                "experience": ExperienceItemSerializer(ExperienceItem.objects.all(), many=True).data,
                "skills": SkillGroupSerializer(SkillGroup.objects.all(), many=True).data,
            }
        )


# ---- Generic list CRUD ------------------------------------------------------


class _List(generics.ListCreateAPIView):
    permission_classes = [ReadOnlyOrSuperUser]


class _Detail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [ReadOnlyOrSuperUser]


class NewsListView(_List):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer


class NewsDetailView(_Detail):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer


class EducationListView(_List):
    queryset = EducationItem.objects.all()
    serializer_class = EducationItemSerializer


class EducationDetailView(_Detail):
    queryset = EducationItem.objects.all()
    serializer_class = EducationItemSerializer


class ExperienceListView(_List):
    queryset = ExperienceItem.objects.all()
    serializer_class = ExperienceItemSerializer


class ExperienceDetailView(_Detail):
    queryset = ExperienceItem.objects.all()
    serializer_class = ExperienceItemSerializer


class SkillListView(_List):
    queryset = SkillGroup.objects.all()
    serializer_class = SkillGroupSerializer


class SkillDetailView(_Detail):
    queryset = SkillGroup.objects.all()
    serializer_class = SkillGroupSerializer


class ProjectListView(_List):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectDetailView(_Detail):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


# ---- Agent skills -----------------------------------------------------------


class AgentSkillListView(generics.ListCreateAPIView):
    """Public list shows published entries; the owner sees unpublished too (?all=1)."""

    permission_classes = [ReadOnlyOrSuperUser]
    serializer_class = AgentSkillSerializer

    def get_queryset(self):
        qs = AgentSkill.objects.all()
        user = self.request.user
        show_all = self.request.query_params.get("all") == "1"
        if not (show_all and user.is_authenticated and user.is_superuser):
            qs = qs.filter(published=True)
        return qs


class AgentSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin edit by id (full record); public read by id is published-only."""

    permission_classes = [ReadOnlyOrSuperUser]
    serializer_class = AgentSkillSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_superuser:
            return AgentSkill.objects.all()
        return AgentSkill.objects.filter(published=True)


# ---- Blog -------------------------------------------------------------------


class BlogListView(generics.ListCreateAPIView):
    """Public list shows published posts; the owner sees drafts too (?all=1)."""

    permission_classes = [ReadOnlyOrSuperUser]
    serializer_class = BlogPostListSerializer

    def get_queryset(self):
        qs = BlogPost.objects.all()
        user = self.request.user
        show_all = self.request.query_params.get("all") == "1"
        if not (show_all and user.is_authenticated and user.is_superuser):
            qs = qs.filter(published=True)
        return qs

    def get_serializer_class(self):
        # Creates need the body field.
        return BlogPostDetailSerializer if self.request.method == "POST" else BlogPostListSerializer


class BlogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin edit by id (full record); public read by id is published-only."""

    permission_classes = [ReadOnlyOrSuperUser]
    serializer_class = BlogPostDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_superuser:
            return BlogPost.objects.all()
        # Non-owners must not reach unpublished drafts by guessing ids.
        return BlogPost.objects.filter(published=True)


class BlogBySlugView(APIView):
    """Public detail by slug (published only)."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        post = get_object_or_404(BlogPost, slug=slug, published=True)
        return Response(BlogPostDetailSerializer(post).data)


def _unique_slug(base: str) -> str:
    """A blog slug that doesn't collide; appends -2, -3, … when needed."""
    # Cap to leave headroom for the numeric suffix under SlugField(max_length=200).
    base = (base or "post")[:190]
    slug, n = base, 2
    while BlogPost.objects.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _truthy(v) -> bool:
    if isinstance(v, bool):
        return v
    return str(v).strip().lower() in ("1", "true", "yes", "on")


class BlogUploadView(APIView):
    """Create a blog post from an uploaded markdown document (owner only).

    Accepts either a multipart `file` field (``-F file=@post.md``) or a JSON
    body ``{"markdown": "…", "published": true}``. The optional `published`
    field overrides any `published:` frontmatter. Frontmatter is parsed for
    title/date/summary/tags/slug; the slug is derived from the title when
    absent and de-duplicated. Returns the created post (201).
    """

    permission_classes = [ReadOnlyOrSuperUser]

    def post(self, request):
        upload = request.FILES.get("file")
        if upload is not None:
            text = upload.read().decode("utf-8", errors="replace")
        else:
            raw = request.data.get("markdown") if isinstance(request.data, dict) else None
            text = raw if isinstance(raw, str) else ""

        if not text.strip():
            return Response(
                {"detail": "Provide markdown as a `file` upload or a JSON `markdown` field."},
                status=400,
            )

        try:
            parsed = parse_blog_markdown(text)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        if isinstance(request.data, dict) and request.data.get("published") is not None:
            parsed["published"] = _truthy(request.data.get("published"))

        parsed["slug"] = _unique_slug(slugify(parsed["slug"]) or slugify(parsed["title"]))
        post = BlogPost.objects.create(**parsed)
        return Response(BlogPostDetailSerializer(post).data, status=201)
