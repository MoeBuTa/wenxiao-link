from django.urls import path

from scholar.views import CronSyncView, PublicationListView, RefreshView

urlpatterns = [
    path("publications/", PublicationListView.as_view(), name="scholar-publications"),
    path("refresh/", RefreshView.as_view(), name="scholar-refresh"),
    path("cron-sync/", CronSyncView.as_view(), name="scholar-cron-sync"),
]
