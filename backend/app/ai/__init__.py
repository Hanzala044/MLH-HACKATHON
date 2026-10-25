from app.ai.base import ModelClient
from app.ai.gemini_client import GeminiClient
from app.ai.ollama_client import OllamaClient
from app.ai.prompts import EXTRACTION_SYSTEM_PROMPT, build_extraction_prompt
from app.config import get_settings


def get_model_client(mode: str = None) -> ModelClient:
    settings = get_settings()
    selected_mode = mode or settings.model_mode
    if selected_mode == "local":
        return OllamaClient()
    return GeminiClient()


__all__ = ["ModelClient", "GeminiClient", "OllamaClient", "EXTRACTION_SYSTEM_PROMPT", "get_model_client"]
