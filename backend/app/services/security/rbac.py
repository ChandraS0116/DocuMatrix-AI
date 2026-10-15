from fastapi import Depends, HTTPException, status
from typing import Callable
from app.services.security.auth import get_current_user, User

class RoleChecker:
    def __init__(self, required_roles: list[str]):
        self.required_roles = required_roles

    def __call__(self, user: User = Depends(get_current_user)):
        for role in self.required_roles:
            if role not in user.roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Operation not permitted. Required role: {role}"
                )
        return user

def require_role(role: str) -> Callable:
    """
    Dependency generator for enforcing RBAC.
    """
    return RoleChecker([role])
