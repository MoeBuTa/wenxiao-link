from django.contrib import admin

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


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "title", "affiliation")


@admin.register(AgentSkill)
class AgentSkillAdmin(admin.ModelAdmin):
    list_display = ("name", "source", "category", "origin", "published", "order")
    list_filter = ("source", "category", "published")
    list_editable = ("published", "order")
    prepopulated_fields = {"slug": ("origin", "name")}


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ("date", "text", "order")
    list_editable = ("order",)


@admin.register(EducationItem)
class EducationItemAdmin(admin.ModelAdmin):
    list_display = ("degree", "institution", "period", "order")
    list_editable = ("order",)


@admin.register(ExperienceItem)
class ExperienceItemAdmin(admin.ModelAdmin):
    list_display = ("role", "org", "period", "order")
    list_editable = ("order",)


@admin.register(SkillGroup)
class SkillGroupAdmin(admin.ModelAdmin):
    list_display = ("group", "order")
    list_editable = ("order",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "highlight", "stars", "order")
    list_editable = ("highlight", "order")


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "date", "published")
    list_filter = ("published",)
    prepopulated_fields = {"slug": ("title",)}
