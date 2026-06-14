"""URL configuration for the wenxiao.link API.

Every route lives under /api/ so a single cloudflared path rule
(`hostname: wenxiao.link, path: ^/api/`) can split traffic between this
backend and the Next.js frontend on the same hostname.
"""

from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "wenxiao.link API"
admin.site.site_title = "wenxiao.link API Portal"
admin.site.index_title = "Welcome to the wenxiao.link API Portal"

api_patterns = [
    path("auth/", include("authenticate.urls")),
    path("content/", include("content.urls")),
    path("qa/", include("qa.urls")),
    path("scholar/", include("scholar.urls")),
    path("stats/", include("stats.urls")),
    path("", include("core.urls")),
    path("django-admin/", admin.site.urls),
]

urlpatterns = [
    path("api/", include(api_patterns)),
]
