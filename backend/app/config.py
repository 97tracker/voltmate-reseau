from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VoltMate"
    app_env: str = "production"
    debug: bool = False
    api_v1_prefix: str = "/api"

    public_base_url: str = "http://localhost:8101"

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    cors_origins: str = "*"

    postgres_user: str = "voltmate"
    postgres_password: str = "voltmate"
    postgres_db: str = "voltmate"
    postgres_host: str = "voltmate-db"
    postgres_port: int = 5432

    redis_url: str = "redis://voltmate-redis:6379/0"

    max_upload_size_mb: int = 5
    upload_dir: str = "/app/uploads"

    report_rate_limit: str = "5/minute"

    use_mock_ai: bool = True
    ai_api_key: str = ""
    ai_api_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
