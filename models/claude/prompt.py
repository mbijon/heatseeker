"""High-level orchestration for having Claude play Heatseeker via computer use."""
from __future__ import annotations

import textwrap
from dataclasses import dataclass
from typing import Generator, Optional

from . import config
from .client import ClaudeComputerUseClient
from .events import ComputerUseEvent


SYSTEM_PROMPT = textwrap.dedent(
    """
    You are Claude with access to Anthropic's official computer-use tool. Operate the
    provided workstation responsibly: keep activity inside the provided sandbox, avoid
    downloading untrusted binaries, and never interact with local resources outside the
    virtual machine. Follow the user's plan precisely.
    """
)

USER_INSTRUCTIONS = textwrap.dedent(
    """
    Play Heatseeker at {url} until the run naturally ends. Use only the public website
    so you have no special advantage over other players. 

    Minimum requirements:
      • Open the production site in the default browser.
      • Use the on-screen or keyboard controls to move the explorer from the
        bottom-left starting square toward the goal in the top-right.
      • Reveal heat levels by stepping on tiles and avoid lava based on the color hints.
      • When a run ends, summarise the attempt including level reached and whether
        the avatar survived.

    Helpful details about the UI:
      • Click the "Start Game" button on the landing screen to reveal the board.
      • The D-pad shows four buttons with arrow glyphs (↑, ←, →, ↓) that map to moves.
      • Game summaries present either a green "Level Complete" panel or a red "Game Over" panel.
      • After finishing or losing, "Play Again" returns to the menu while "Retry Level" restarts.
      • Keyboard arrow keys are also supported if you prefer them.

    Narrate important decisions so observers can follow your reasoning. Do not attempt
    to script the game or call local project files—interact strictly through the live
    site.
    """
)


@dataclass
class HeatseekerClaudePlayer:
    """Runs a Heatseeker session through Claude's computer-use interface."""

    client: ClaudeComputerUseClient
    heatseeker_url: str = config.HEATSEEKER_URL

    def build_user_prompt(self) -> str:
        """Return the full user prompt used for the computer session."""

        return USER_INSTRUCTIONS.format(url=self.heatseeker_url)

    def build_system_prompt(self) -> str:
        """Return the default system prompt for computer-use runs."""

        return SYSTEM_PROMPT

    def play(
        self,
        *,
        max_output_tokens: int = 4096,
        temperature: float = 0.0,
        metadata: Optional[dict[str, str]] = None,
    ) -> Generator[ComputerUseEvent, None, None]:
        """Start a streaming session instructing Claude to play Heatseeker."""

        return self.client.stream_computer_use(
            system_prompt=self.build_system_prompt(),
            user_prompt=self.build_user_prompt(),
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            metadata=metadata,
        )

    def generate_payload(
        self,
        *,
        max_output_tokens: int = 4096,
        temperature: float = 0.0,
        metadata: Optional[dict[str, str]] = None,
    ) -> dict[str, object]:
        """Expose the JSON payload that will be submitted to the API."""

        return self.client.build_play_payload(
            system_prompt=self.build_system_prompt(),
            user_prompt=self.build_user_prompt(),
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            metadata=metadata,
        )
