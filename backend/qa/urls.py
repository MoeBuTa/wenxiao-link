from django.urls import path

from qa.views import CommentDetailView, CommentListCreateView

urlpatterns = [
    path("", CommentListCreateView.as_view(), name="qa-list-create"),
    path("<int:pk>/", CommentDetailView.as_view(), name="qa-detail"),
]
