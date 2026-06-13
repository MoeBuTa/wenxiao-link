from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from authenticate.cookies import clear_auth_cookie, set_auth_cookie
from authenticate.serializers import HasuraTokenObtainPairSerializer, RegisterSerializer


User = get_user_model()


def _user_payload(user) -> dict:
    return {
        "uid": str(user.id),
        "username": user.username,
        "email": user.email or "",
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined.isoformat() if user.date_joined else None,
    }


def _access_token_for(user) -> str:
    # get_token() returns the refresh token; the cookie carries the access
    # token derived from it (custom Hasura claims propagate across).
    return str(HasuraTokenObtainPairSerializer.get_token(user).access_token)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-write"

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid username or password."}, status=401)

        response = Response({"user": _user_payload(user)})
        set_auth_cookie(response, _access_token_for(user))
        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-write"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        response = Response({"user": _user_payload(user)}, status=201)
        set_auth_cookie(response, _access_token_for(user))
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"ok": True})
        clear_auth_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user))
