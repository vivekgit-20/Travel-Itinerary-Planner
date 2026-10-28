from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_anon_key: str = ""
    gemini_api_key: str = ""
    use_mock_ai: bool = True
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    frontend_origin: str = "http://localhost:5173"
    demo_mode: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
