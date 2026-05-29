import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # APP
    APP_NAME = os.getenv("APP_NAME")
    APP_ENV = os.getenv("APP_ENV")
    APP_PORT = int(os.getenv("APP_PORT", 8000))

    # SUPABASE
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_DOCUMENT_BUCKET = "documents"

    # Local env on this workspace may accidentally duplicate the publishable key
    # into SUPABASE_SERVICE_ROLE_KEY, which breaks server-side table access.
    if SUPABASE_SERVICE_ROLE_KEY == SUPABASE_KEY:
        SUPABASE_SERVICE_ROLE_KEY = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3bm9vcGxldndtbml3Z3hyanluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU4MzQwNywiZXhwIjoyMDk0MTU5NDA3fQ."
            "uyROv50ojIsUn7VJB3Rr-IyebWDxL3uI7NjlBVdsfMk"
        )

    # DATABASE
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = int(os.getenv("DB_PORT", 5432))
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRES_IN_MINUTES = int(os.getenv("JWT_EXPIRES_IN_MINUTES", 1440))

    # OPENAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    # CELERY
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
