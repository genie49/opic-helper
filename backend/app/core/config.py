"""
Application configuration using pydantic-settings.
Environment variables are loaded from .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Application
    APP_NAME: str = "OPIc Learning Service"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Grok (xAI) LLM
    XAI_API_KEY: str
    XAI_API_BASE: str = "https://api.x.ai/v1"
    XAI_MODEL: str = "grok-2-latest"

    # Server
    PORT: int = 8080
    HOST: str = "0.0.0.0"


settings = Settings()
