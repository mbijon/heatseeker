"""Entry point for launching a Heatseeker computer-use session."""
from __future__ import annotations

import argparse
import json
import sys
from typing import Iterable

from .client import ClaudeComputerUseClient
from .prompt import HeatseekerClaudePlayer


def format_event(event) -> str:
    """Pretty-print an event for terminal output."""

    payload = {"type": event.event_type, **event.payload}
    return json.dumps(payload, indent=2, sort_keys=True)


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Stream Claude computer-use events while it plays Heatseeker.")
    parser.add_argument("--max-output-tokens", type=int, default=4096, help="Maximum output tokens to request from Claude.")
    parser.add_argument("--temperature", type=float, default=0.0, help="Sampling temperature for the completion.")
    args = parser.parse_args(argv)

    with ClaudeComputerUseClient() as client:
        player = HeatseekerClaudePlayer(client)
        for event in player.play(
            max_output_tokens=args.max_output_tokens,
            temperature=args.temperature,
        ):
            print(format_event(event))
    return 0


if __name__ == "__main__":  # pragma: no cover - convenience entry point
    sys.exit(main())
