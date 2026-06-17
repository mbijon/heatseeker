"""HTTP client used to talk to Anthropic's computer-use API."""
from __future__ import annotations

import json
import os
from typing import Dict, Generator, Optional

import httpx

from . import config
from .events import ComputerUseEvent


class AnthropicAPIError(RuntimeError):
    """Raised when the Anthropic API returns an unexpected response."""


class ClaudeComputerUseClient:
    """Thin wrapper around Anthropic's official Messages API."""

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        model: str = config.DEFAULT_MODEL,
        base_url: str = config.ANTHROPIC_API_URL,
        beta_header: str = config.COMPUTER_USE_BETA_HEADER,
        tool_type: str = config.COMPUTER_TOOL_TYPE,
        tool_name: str = config.COMPUTER_TOOL_NAME,
        http_client: Optional[httpx.Client] = None,
        request_timeout: float = 90.0,
    ) -> None:
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("An Anthropic API key must be supplied via the constructor or ANTHROPIC_API_KEY.")

        self.model = model
        self.base_url = base_url.rstrip("/")
        self.beta_header = beta_header
        self.tool_type = tool_type
        self.tool_name = tool_name
        self._client = http_client or httpx.Client(timeout=request_timeout)

    def close(self) -> None:
        """Release underlying HTTP resources."""

        self._client.close()

    def __enter__(self) -> "ClaudeComputerUseClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # type: ignore[override]
        self.close()

    # Headers for SSE streaming requests.
    def _headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": config.ANTHROPIC_VERSION,
            "anthropic-beta": self.beta_header,
            "content-type": "application/json",
            "accept": "text/event-stream",
        }

    def _payload(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int,
        temperature: float,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, object]:
        payload: Dict[str, object] = {
            "model": self.model,
            "max_output_tokens": max_output_tokens,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt,
                        }
                    ],
                }
            ],
            "tools": [
                {
                    "type": self.tool_type,
                    "name": self.tool_name,
                }
            ],
            "tool_choice": {"type": "tool", "name": self.tool_name},
            "temperature": temperature,
        }

        if metadata:
            payload["metadata"] = metadata

        return payload

    def stream_computer_use(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int = 4096,
        temperature: float = 0.0,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Generator[ComputerUseEvent, None, None]:
        """Send a message request and yield computer-use streaming events."""

        payload = self._payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            metadata=metadata,
        )

        url = f"{self.base_url}/v1/messages"
        with self._client.stream("POST", url, headers=self._headers(), json=payload) as response:
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:  # pragma: no cover - defensive path
                raise AnthropicAPIError(str(exc)) from exc

            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                if isinstance(raw_line, bytes):
                    decoded = raw_line.decode("utf-8")
                else:
                    decoded = raw_line
                if not decoded.startswith("data: "):
                    continue
                data = decoded[len("data: "):].strip()
                if data == "[DONE]":
                    break
                try:
                    event_payload = json.loads(data)
                except json.JSONDecodeError as exc:  # pragma: no cover - defensive path
                    raise AnthropicAPIError(f"Invalid JSON event: {data}") from exc
                yield ComputerUseEvent.from_stream(event_payload)

    def build_play_payload(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        **kwargs: object,
    ) -> Dict[str, object]:
        """Expose the request payload for testing and documentation."""

        return self._payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_output_tokens=int(kwargs.get("max_output_tokens", 4096)),
            temperature=float(kwargs.get("temperature", 0.0)),
            metadata=kwargs.get("metadata"),
        )
