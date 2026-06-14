from django.urls import path

from stats import views

urlpatterns = [
    path("hit/", views.HitView.as_view(), name="stats-hit"),
    path("summary/", views.SummaryView.as_view(), name="stats-summary"),
    path("blog/", views.BlogStatsView.as_view(), name="stats-blog"),
]
