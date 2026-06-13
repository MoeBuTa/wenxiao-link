from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from qa.models import Comment
from qa.serializers import (
    CommentCreateSerializer,
    CommentUpdateSerializer,
    can_modify,
    comment_payload,
    thread_payload,
)


class CommentListCreateView(APIView):
    """GET  /api/qa/   public board: top-level comments with nested replies
    POST /api/qa/   anyone may post; guests must supply guest_name"""

    permission_classes = [AllowAny]
    throttle_scope = "qa-write"

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return []

    def get(self, request):
        comments = (
            Comment.objects.filter(parent__isnull=True)
            .select_related("author")
            .prefetch_related("replies__author")
        )
        return Response([thread_payload(c, request.user) for c in comments])

    def post(self, request):
        serializer = CommentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(comment_payload(comment, request.user), status=201)


class CommentDetailView(APIView):
    """PATCH  /api/qa/<id>/   edit body (owner: any comment; author: own)
    DELETE /api/qa/<id>/   same permission; deleting a thread removes replies"""

    permission_classes = [AllowAny]

    def _get_or_403(self, request, pk) -> Comment:
        comment = get_object_or_404(Comment, pk=pk)
        if not can_modify(request.user, comment):
            return None
        return comment

    def patch(self, request, pk):
        comment = self._get_or_403(request, pk)
        if comment is None:
            return Response({"detail": "You cannot edit this comment."}, status=403)
        serializer = CommentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment.body = serializer.validated_data["body"].strip()
        comment.is_edited = True
        comment.save(update_fields=["body", "is_edited", "updated_at"])
        return Response(comment_payload(comment, request.user))

    def delete(self, request, pk):
        comment = self._get_or_403(request, pk)
        if comment is None:
            return Response({"detail": "You cannot delete this comment."}, status=403)
        comment.delete()
        return Response(status=204)
