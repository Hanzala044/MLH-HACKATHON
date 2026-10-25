import json
import logging
import re
from typing import Optional
import httpx
from app.ai.base import ModelClient
from app.ai.prompts import EXTRACTION_SYSTEM_PROMPT, build_extraction_prompt
from app.config import get_settings

logger = logging.getLogger(__name__)


class OllamaClient(ModelClient):
    """Client for local Gemma 4 via Ollama."""

    def __init__(self, ollama_url: Optional[str] = None, model_name: Optional[str] = None):
        settings = get_settings()
        self.ollama_url = (ollama_url or settings.ollama_url).rstrip("/")
        self.model_name = model_name or settings.gemma_local_model or "gemma4:e4b"

    def _clean_json_response(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        return text.strip()

    def extract(self, images: list[bytes], note: str = "", context: Optional[dict] = None) -> dict:
        import base64
        corrections = (context or {}).get("corrections", [])
        prompt_text = build_extraction_prompt(note=note, corrections=corrections)

        try:
            b64_images = [base64.b64encode(img).decode("utf-8") for img in images]
            url = f"{self.ollama_url}/api/generate"
            payload = {
                "model": self.model_name,
                "system": EXTRACTION_SYSTEM_PROMPT,
                "prompt": prompt_text,
                "images": b64_images,
                "stream": False,
                "format": "json"
            }

            with httpx.Client(timeout=60.0) as client:
                res = client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()

            raw_text = data.get("response", "{}")
            return json.loads(self._clean_json_response(raw_text))

        except Exception as e:
            logger.error(f"Ollama local extraction failed: {e}")
            from app.ai.gemini_client import GeminiClient
            return GeminiClient()._fallback_extraction(images, note, error=f"Ollama unavailable: {e}")

    def verify(self, images: list[bytes], first_pass: dict) -> dict:
        subtotal = first_pass.get("subtotal") or 0.0
        tax = first_pass.get("tax_amount") or 0.0
        total = first_pass.get("total") or 0.0
        diff = abs((subtotal + tax) - total)
        return {
            "verified": diff <= 1.0,
            "discrepancy": round(diff, 2) if diff > 1.0 else 0.0,
            "subtotal": subtotal,
            "tax_amount": tax,
            "total": total
        }

    def answer(self, question: str, receipts_context: list[dict]) -> dict:
        try:
            url = f"{self.ollama_url}/api/generate"
            summary = [
                {
                    "id": str(r.get("id")),
                    "vendor": r.get("vendor"),
                    "amount": float(r.get("total") or 0),
                    "category": r.get("category"),
                    "date": str(r.get("receipt_date") or "")
                }
                for r in receipts_context[:25]
            ]
            prompt = (
                f"Ledger: {json.dumps(summary)}\n\n"
                f"Question: {question}\n\n"
                "Return JSON with {'answer': '...', 'cited_ids': ['...']}"
            )
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                res.raise_for_status()
                raw = res.json().get("response", "{}")
                return json.loads(self._clean_json_response(raw))
        except Exception as e:
            logger.error(f"Ollama answer failed: {e}")
            from app.ai.gemini_client import GeminiClient
            return GeminiClient()._fallback_answer(question, receipts_context)
