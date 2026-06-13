from rest_framework.permissions import SAFE_METHODS, BasePermission


class ReadOnlyOrSuperUser(BasePermission):
    """Anyone may read (GET/HEAD/OPTIONS); only the site owner may write."""

    message = "Admin privileges required to edit content."

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and u.is_superuser)
