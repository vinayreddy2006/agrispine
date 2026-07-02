from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    HUGGINGFACEHUB_API_TOKEN: str = ""

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
