from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import Config
from repositories.auth_repository import find_role_codes_by_user_id

security = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    user_id: int
    username: str
    roles: list[str]


def _decode_jwt_token(token: str) -> dict:
    if not Config.JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing JWT configuration",
        )

    try:
        return jwt.decode(
            token,
            Config.JWT_SECRET,
            algorithms=[Config.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc


def _extract_roles_from_payload(payload: dict) -> list[str]:
    """
    Prefer role claims embedded in JWT to avoid DB round-trips on every request.
    Falls back to database lookup only when token has no valid roles claim.
    """
    raw_roles = payload.get("roles")
    if isinstance(raw_roles, list):
        return [str(role) for role in raw_roles if str(role).strip()]
    if isinstance(raw_roles, str) and raw_roles.strip():
        return [raw_roles.strip()]
    return []

async def require_authenticated_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required",
        )

    token = credentials.credentials

    payload = _decode_jwt_token(token)

    user_id = int(payload["sub"])
    username = str(payload.get("username") or "")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    roles = _extract_roles_from_payload(payload)
    if not roles:
        roles = await find_role_codes_by_user_id(user_id)

    current_user = CurrentUser(
        user_id=user_id,
        username=username,
        roles=roles,
    )

    request.state.current_user = current_user

    return current_user

def require_roles(*required_roles: str):
    async def _role_checker(
        request: Request,
        current_user: CurrentUser = Depends(require_authenticated_user),
    ) -> CurrentUser:
        if not required_roles:
            return current_user

        if not any(role in current_user.roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )

        request.state.current_user = current_user
        return current_user

    return _role_checker
