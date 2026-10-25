from typing import Protocol


class ModelClient(Protocol):
    """Interface for AI model backends (Gemini API or local Ollama)."""

    def extract(self, images: list[bytes], note: str, context: dict) -> dict:
        """Extract structured data from receipt image(s)."""
        ...

    def verify(self, images: list[bytes], first_pass: dict) -> dict:
        """Second-pass verification with thinking mode (P1)."""
        ...

    def answer(self, question: str, tools: list[dict]) -> dict:
        """Answer questions over the ledger using function calling (P1)."""
        ...
