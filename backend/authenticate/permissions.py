from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    """Only authenticated users with `is_superuser=True` may access the view."""

    message = "Admin privileges required."

    def has_permission(self, request, view) -> bool:
        u = request.user
        return bool(u and u.is_authenticated and u.is_superuser)
