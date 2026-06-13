from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """JWT authentication that prefers an httpOnly cookie set by the login
    endpoint, falling back to the standard `Authorization: Bearer ...` header.

    The header path keeps Hasura and any non-browser clients working.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated = self.get_validated_token(raw_token)
                return self.get_user(validated), validated

        cookie_value = request.COOKIES.get(settings.WENXIAO_AUTH_COOKIE_NAME)
        if not cookie_value:
            return None

        try:
            validated = self.get_validated_token(cookie_value)
            return self.get_user(validated), validated
        except (AuthenticationFailed, InvalidToken, TokenError):
            # A stale/garbage cookie must read as "anonymous", not a 401 —
            # public pages still authenticate optionally. AuthenticationFailed
            # covers get_user() failures (user deleted/deactivated), which are
            # not token errors; without it a 30-day cookie from a removed
            # account would 401 every endpoint, including AllowAny views.
            return None
