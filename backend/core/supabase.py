from supabase import create_client, Client

from core.config import Config


class SupabaseManager:
    _client: Client | None = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
                raise ValueError(
                    "Missing SUPABASE_URL or SUPABASE_KEY"
                )

            cls._client = create_client(
                Config.SUPABASE_URL,
                Config.SUPABASE_SERVICE_ROLE_KEY,
            )

        return cls._client