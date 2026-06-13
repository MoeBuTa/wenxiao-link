from django.urls import path

from content import views

urlpatterns = [
    path("site/", views.SiteContentView.as_view(), name="content-site"),
    path("profile/", views.ProfileView.as_view(), name="content-profile"),
    path("news/", views.NewsListView.as_view(), name="content-news"),
    path("news/<int:pk>/", views.NewsDetailView.as_view(), name="content-news-detail"),
    path("education/", views.EducationListView.as_view(), name="content-education"),
    path("education/<int:pk>/", views.EducationDetailView.as_view(), name="content-education-detail"),
    path("experience/", views.ExperienceListView.as_view(), name="content-experience"),
    path("experience/<int:pk>/", views.ExperienceDetailView.as_view(), name="content-experience-detail"),
    path("skills/", views.SkillListView.as_view(), name="content-skills"),
    path("skills/<int:pk>/", views.SkillDetailView.as_view(), name="content-skills-detail"),
    path("projects/", views.ProjectListView.as_view(), name="content-projects"),
    path("projects/<int:pk>/", views.ProjectDetailView.as_view(), name="content-projects-detail"),
    path("blog/", views.BlogListView.as_view(), name="content-blog"),
    path("blog/<int:pk>/", views.BlogDetailView.as_view(), name="content-blog-detail"),
    path("blog/by-slug/<slug:slug>/", views.BlogBySlugView.as_view(), name="content-blog-slug"),
]
