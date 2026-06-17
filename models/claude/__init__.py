"""Claude computer-use integration for playing Heatseeker."""
from .client import AnthropicAPIError, ClaudeComputerUseClient
from .events import ComputerUseEvent
from .prompt import HeatseekerClaudePlayer

__all__ = [
    "AnthropicAPIError",
    "ClaudeComputerUseClient",
    "ComputerUseEvent",
    "HeatseekerClaudePlayer",
]
