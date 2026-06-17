"""Utilities for normalising Anthropic's streaming events."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class ComputerUseEvent:
    """Represents an event emitted while Claude is using the computer tool."""

    event_type: str
    payload: Dict[str, Any]

    @classmethod
    def from_stream(cls, message: Dict[str, Any]) -> "ComputerUseEvent":
        """Create an event from the JSON dictionary emitted by Anthropic.

        Anthropic wraps most values in an object with a ``type`` field.
        The rest of the keys contain the payload for the specific event.
        """

        event_type = message.get("type", "unknown")
        payload = {key: value for key, value in message.items() if key != "type"}
        return cls(event_type=event_type, payload=payload)

    def is_tool_use(self) -> bool:
        """Return ``True`` when the event begins a computer-tool action."""

        if self.event_type != "content_block_start":
            return False
        block = self.payload.get("content_block") or {}
        return block.get("type") == "tool_use"
