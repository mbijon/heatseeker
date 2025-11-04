"""Tests covering the Claude computer-use integration."""
from __future__ import annotations

from typing import Dict, List

import pytest
from unittest.mock import Mock

from models.claude.client import ClaudeComputerUseClient
from models.claude.events import ComputerUseEvent
from models.claude.prompt import HeatseekerClaudePlayer
from models.claude import config


class _FakeStreamResponse:
    """Minimal stub that mimics ``httpx.Client.stream`` for unit tests."""

    def __init__(self, lines: List[str]) -> None:
        self._lines = lines

    def __enter__(self) -> "_FakeStreamResponse":  # pragma: no cover - behaviour verified indirectly
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # pragma: no cover - behaviour verified indirectly
        return None

    def iter_lines(self):
        for line in self._lines:
            yield line

    def raise_for_status(self) -> None:
        return None


def test_user_prompt_mentions_production_url(page) -> None:
    """Ensure the player tells Claude to use the production Heatseeker deployment."""

    player = HeatseekerClaudePlayer(client=Mock(spec=ClaudeComputerUseClient))  # type: ignore[arg-type]
    prompt = player.build_user_prompt()

    # Use Playwright to assert the instructions mention the canonical URL and controls.
    page.set_content(f"<article>{prompt}</article>")
    assert page.locator(f"text='{config.HEATSEEKER_URL}'").count() == 1
    assert page.locator("text='Start Game'").count() == 1
    assert page.locator("text='↑'").count() == 1


def test_stream_payload_and_events(monkeypatch) -> None:
    """``play`` should send a valid API payload and parse streaming events."""

    captured: Dict[str, object] = {}

    def fake_stream(method, url, *, headers, json, **kwargs):  # noqa: ANN001
        captured["method"] = method
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        lines = [
            "data: {\"type\": \"message_start\", \"message\": {\"id\": \"msg_1\"}}",
            "data: {\"type\": \"content_block_start\", \"content_block\": {\"type\": \"tool_use\", \"name\": \"computer\"}}",
            "data: {\"type\": \"content_block_delta\", \"delta\": {\"type\": \"input_text\", \"text\": \"open_url\"}}",
            "data: [DONE]",
        ]
        return _FakeStreamResponse(lines)

    client = ClaudeComputerUseClient(api_key="test", http_client=Mock())  # type: ignore[arg-type]
    monkeypatch.setattr(client._client, "stream", fake_stream)

    player = HeatseekerClaudePlayer(client)
    events = list(player.play())

    assert captured["method"] == "POST"
    assert captured["url"].endswith("/v1/messages")
    assert captured["headers"]["accept"] == "text/event-stream"
    user_message = captured["json"]["messages"][0]["content"][0]["text"]
    assert config.HEATSEEKER_URL in user_message

    assert len(events) == 3  # The [DONE] marker should be excluded.
    assert events[0].event_type == "message_start"
    assert events[1].is_tool_use()
    assert isinstance(events[2], ComputerUseEvent)
