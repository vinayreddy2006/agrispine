import os
from pydantic_settings import BaseSettings
from typing import List

# Resolve path to ai/.env relative to this config file
_ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

class Settings(BaseSettings):
    # Selected AI provider: 'groq' or 'huggingface'
    AI_PROVIDER: str = "groq"

    # Groq Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    GROQ_FALLBACK_MODELS: str = "openai/gpt-oss-120b,openai/gpt-oss-20b,allam-2-7b"
    GROQ_BASE_URL: str = "https://api.groq.com"

    # Hugging Face Configuration
    HF_API_KEY: str = ""
    HUGGINGFACEHUB_API_TOKEN: str = ""
    HF_MODEL: str = "Qwen/Qwen2.5-Coder-32B-Instruct"
    HF_FALLBACK_MODELS: str = "meta-llama/Llama-3.2-3B-Instruct,HuggingFaceH4/zephyr-7b-beta"

    # Google Gemini Configuration (Optional)
    GEMINI_API_KEY: str = ""

    # Common AI Execution Controls
    AI_TEMPERATURE: float = 0.2
    AI_MAX_RETRIES: int = 2
    AI_TIMEOUT: int = 30

    @property
    def groq_fallbacks(self) -> List[str]:
        if not self.GROQ_FALLBACK_MODELS:
            return []
        return [m.strip() for m in self.GROQ_FALLBACK_MODELS.split(",") if m.strip()]

    @property
    def hf_fallbacks(self) -> List[str]:
        if not self.HF_FALLBACK_MODELS:
            return []
        return [m.strip() for m in self.HF_FALLBACK_MODELS.split(",") if m.strip()]

    @property
    def hf_token(self) -> str:
        tok = self.HF_API_KEY.strip() if self.HF_API_KEY else ""
        if not tok:
            tok = self.HUGGINGFACEHUB_API_TOKEN.strip() if self.HUGGINGFACEHUB_API_TOKEN else ""
        return tok

    class Config:
        env_file = _ENV_FILE
        extra = "allow"

settings = Settings()
