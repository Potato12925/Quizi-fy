import asyncio
import threading
from typing import Callable, TypeVar

import httpx
from supabase import Client, create_client

from core.config import Config

T = TypeVar("T")


class SupabaseManager:
    _client: Client | None = None
    _lock = threading.Lock()

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            with cls._lock:
                if cls._client is None:
                    if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_ROLE_KEY:
                        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

                    cls._client = create_client(
                        Config.SUPABASE_URL,
                        Config.SUPABASE_SERVICE_ROLE_KEY,
                    )
                    cls._configure_http_transport(cls._client)

        return cls._client

    @classmethod
    def reset_client(cls) -> None:
        with cls._lock:
            if cls._client is not None:
                try:
                    old_session = getattr(cls._client.postgrest, "session", None)
                    if old_session is not None:
                        old_session.close()
                except Exception:
                    pass
            cls._client = None

    @classmethod
    def _configure_http_transport(cls, client: Client) -> None:
        postgrest_client = client.postgrest
        old_session: httpx.Client = postgrest_client.session
        new_session = httpx.Client(
            base_url=old_session.base_url,
            headers=dict(old_session.headers),
            timeout=old_session.timeout,
            http2=False,
            limits=httpx.Limits(
                max_connections=50,
                max_keepalive_connections=20,
                keepalive_expiry=20.0,
            ),
        )
        # Force HTTP/1.1 to avoid intermittent HTTP/2 socket issues on Windows.
        postgrest_client.session = new_session
        try:
            old_session.close()
        except Exception:
            pass


def _is_transient_supabase_error(exc: Exception) -> bool:
    if isinstance(exc, httpx.ReadError):
        return True
    message = str(exc)
    return (
        "WinError 10035" in message
        or "A non-blocking socket operation could not be completed immediately" in message
        or "ReadError" in message
    )


async def run_supabase_execute(operation: Callable[[], T], retries: int = 3, base_delay_seconds: float = 0.15) -> T:
    """
    Retry transient network failures from Supabase/httpx.
    We recreate the shared client between attempts to avoid stale pooled sockets.
    """
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return await asyncio.to_thread(operation)
        except Exception as exc:
            last_exc = exc
            if not _is_transient_supabase_error(exc) or attempt == retries:
                raise
            SupabaseManager.reset_client()
            await asyncio.sleep(base_delay_seconds * attempt)
    if last_exc:
        raise last_exc
    raise RuntimeError("Supabase execution failed")
