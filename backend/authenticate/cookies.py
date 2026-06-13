from django.conf import settings


def _cookie_kwargs() -> dict:
    return {
        "max_age": settings.WENXIAO_AUTH_COOKIE_MAX_AGE,
        "secure": settings.WENXIAO_AUTH_COOKIE_SECURE,
        "httponly": True,
        "samesite": settings.WENXIAO_AUTH_COOKIE_SAMESITE,
        "domain": settings.WENXIAO_AUTH_COOKIE_DOMAIN,
        "path": "/",
    }


def set_auth_cookie(response, token: str) -> None:
    response.set_cookie(
        settings.WENXIAO_AUTH_COOKIE_NAME,
        token,
        **_cookie_kwargs(),
    )


def clear_auth_cookie(response) -> None:
    response.delete_cookie(
        settings.WENXIAO_AUTH_COOKIE_NAME,
        path="/",
        domain=settings.WENXIAO_AUTH_COOKIE_DOMAIN,
        samesite=settings.WENXIAO_AUTH_COOKIE_SAMESITE,
    )
