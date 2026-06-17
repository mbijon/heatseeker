"""Configuration values for the Claude computer-use integration."""
from __future__ import annotations

ANTHROPIC_API_URL: str = "https://api.anthropic.com"
"""The base URL for Anthropic's public API."""

ANTHROPIC_VERSION: str = "2023-06-01"
"""Stable API version required by Anthropic."""

COMPUTER_USE_BETA_HEADER: str = "computer-use-2024-10-22"
"""Beta header required to unlock the computer-use tool."""

DEFAULT_MODEL: str = "claude-3-5-sonnet-20241022"
"""Claude model that currently supports computer use."""

COMPUTER_TOOL_TYPE: str = "computer_20241022"
"""Identifier for the computer tool supplied in the messages payload."""

COMPUTER_TOOL_NAME: str = "computer"
"""Name used to select the computer tool in the tool_choice field."""

HEATSEEKER_URL: str = "https://heatseeker-one.vercel.app"
"""Production deployment that Claude must use while playing Heatseeker."""
