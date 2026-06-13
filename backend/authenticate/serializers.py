from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


HASURA_CLAIMS_NS = "https://hasura.io/jwt/claims"


User = get_user_model()


def _validate_password_or_raise(value: str) -> str:
    try:
        validate_password(value)
    except DjangoValidationError as e:
        raise serializers.ValidationError(list(e.messages))
    return value


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    password = serializers.CharField(min_length=8, write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken")
        return value

    def validate_password(self, value: str) -> str:
        return _validate_password_or_raise(value)

    def create(self, validated_data: dict) -> "User":
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email") or "",
        )


class HasuraTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds Hasura's claims namespace so the same JWT works against the
    (internal-only) Hasura GraphQL engine."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        role = "admin" if user.is_superuser else "user"
        token[HASURA_CLAIMS_NS] = {
            "x-hasura-allowed-roles": [role, "public"],
            "x-hasura-default-role": role,
            "x-hasura-user-id": str(user.id),
        }
        return token
