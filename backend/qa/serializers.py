from rest_framework import serializers

from qa.models import Comment
from qa.names import generate_guest_name


def can_modify(user, comment: Comment) -> bool:
    """Site owner moderates everything; registered authors manage their own."""
    if not (user and user.is_authenticated):
        return False
    if user.is_superuser:
        return True
    return comment.author_id == user.id


def comment_payload(comment: Comment, user) -> dict:
    return {
        "id": comment.id,
        "parentId": comment.parent_id,
        "body": comment.body,
        "displayName": comment.display_name,
        "isOwner": comment.is_owner_post,
        "isRegistered": bool(comment.author_id),
        "isEdited": comment.is_edited,
        "canModify": can_modify(user, comment),
        "createdAt": comment.created_at.isoformat(),
        "updatedAt": comment.updated_at.isoformat(),
    }


def thread_payload(comment: Comment, user) -> dict:
    data = comment_payload(comment, user)
    replies = sorted(comment.replies.all(), key=lambda c: c.created_at)
    data["replies"] = [comment_payload(r, user) for r in replies]
    return data


class CommentCreateSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=5000, trim_whitespace=True)
    # Guests don't type a name; the server mints a friendly handle. An
    # optional name is still accepted if a client chooses to send one.
    guest_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(), required=False, allow_null=True
    )

    def validate(self, attrs):
        # Replies nest one level deep: replying to a reply lands on its thread.
        parent = attrs.get("parent")
        if parent is not None and parent.parent_id is not None:
            attrs["parent"] = parent.parent
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user if request.user.is_authenticated else None
        guest_name = ""
        if not user:
            guest_name = (validated_data.get("guest_name") or "").strip() or generate_guest_name()
        return Comment.objects.create(
            body=validated_data["body"].strip(),
            parent=validated_data.get("parent"),
            author=user,
            guest_name=guest_name,
        )


class CommentUpdateSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=5000, trim_whitespace=True)
