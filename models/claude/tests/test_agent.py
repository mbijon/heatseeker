"""Tests for computer use agent."""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, Mock

from src.agent import ComputerUseAgent


@pytest.fixture
def mock_api_key():
    """Fixture providing a mock API key."""
    return "sk-test-api-key"


@pytest.fixture
def agent(mock_api_key):
    """Fixture creating an agent instance."""
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": mock_api_key}):
        return ComputerUseAgent(api_key=mock_api_key, headless=True)


def test_agent_initialization(agent, mock_api_key):
    """Test agent initialization."""
    assert agent.api_key == mock_api_key
    assert agent.model == "claude-4-5-sonnet-20241022"
    assert agent.max_iterations == 1000
    assert agent.display_width == 1920
    assert agent.display_height == 1080
    assert agent.headless is True
    assert agent.browser is None
    assert agent.game_url is None


def test_agent_initialization_no_api_key():
    """Test that agent raises error without API key."""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="ANTHROPIC_API_KEY must be set"):
            ComputerUseAgent(api_key=None)


def test_agent_initialization_from_env():
    """Test agent initialization from environment variable."""
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "env-key"}):
        agent = ComputerUseAgent()
        assert agent.api_key == "env-key"


@pytest.mark.asyncio
async def test_agent_execute_action_click(agent):
    """Test executing a click action."""
    agent.browser = AsyncMock()

    action = {"type": "click", "x": 100, "y": 200}
    await agent._execute_action(action)

    agent.browser.click.assert_called_once_with(100, 200)


@pytest.mark.asyncio
async def test_agent_execute_action_type(agent):
    """Test executing a type action."""
    agent.browser = AsyncMock()

    action = {"type": "type", "text": "test text"}
    await agent._execute_action(action)

    agent.browser.type_text.assert_called_once_with("test text")


@pytest.mark.asyncio
async def test_agent_execute_action_key_press(agent):
    """Test executing a key press action."""
    agent.browser = AsyncMock()

    action = {"type": "key_press", "key": "ArrowUp"}
    await agent._execute_action(action)

    agent.browser.press_key.assert_called_once_with("ArrowUp")


@pytest.mark.asyncio
async def test_agent_handle_computer_tool_no_browser(agent):
    """Test that handle_computer_tool fails without browser."""
    block = Mock()
    block.input = {}

    with pytest.raises(RuntimeError, match="Browser not initialized"):
        await agent._handle_computer_tool(block)


@pytest.mark.asyncio
async def test_agent_handle_computer_tool_with_actions(agent):
    """Test handling computer tool with actions."""
    agent.browser = AsyncMock()
    agent.browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")

    block = Mock()
    block.input = {
        "actions": [
            {"type": "click", "x": 100, "y": 200},
            {"type": "type", "text": "test"},
        ]
    }

    result = await agent._handle_computer_tool(block)

    agent.browser.click.assert_called_once_with(100, 200)
    agent.browser.type_text.assert_called_once_with("test")
    assert len(result) == 1
    assert result[0]["type"] == "image"
    assert result[0]["source"]["data"] == "base64_screenshot"


@pytest.mark.asyncio
async def test_agent_handle_computer_tool_with_click(agent):
    """Test handling computer tool with direct click."""
    agent.browser = AsyncMock()
    agent.browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")

    block = Mock()
    block.input = {"click": {"x": 150, "y": 250}}

    result = await agent._handle_computer_tool(block)

    agent.browser.click.assert_called_once_with(150, 250)
    assert len(result) == 1
    assert result[0]["type"] == "image"


@pytest.mark.asyncio
async def test_agent_handle_computer_tool_with_type(agent):
    """Test handling computer tool with direct type."""
    agent.browser = AsyncMock()
    agent.browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")

    block = Mock()
    block.input = {"type": "Claude 4.5"}

    result = await agent._handle_computer_tool(block)

    agent.browser.type_text.assert_called_once_with("Claude 4.5")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_agent_handle_computer_tool_with_key(agent):
    """Test handling computer tool with direct key press."""
    agent.browser = AsyncMock()
    agent.browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")

    block = Mock()
    block.input = {"key": "ArrowUp"}

    result = await agent._handle_computer_tool(block)

    agent.browser.press_key.assert_called_once_with("ArrowUp")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_agent_handle_computer_tool_json_string_input(agent):
    """Test handling computer tool with JSON string input."""
    import json

    agent.browser = AsyncMock()
    agent.browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")

    block = Mock()
    block.input = json.dumps({"actions": [{"type": "click", "x": 100, "y": 200}]})

    result = await agent._handle_computer_tool(block)

    agent.browser.click.assert_called_once_with(100, 200)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_agent_run_complete_flow(agent, mock_api_key):
    """Test the complete agent run flow."""
    # Mock browser
    mock_browser = AsyncMock()
    mock_browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")
    mock_browser.navigate = AsyncMock()

    # Mock Anthropic client
    mock_response = MagicMock()
    mock_response.content = []  # No tool use, conversation ends

    with patch("src.agent.BrowserController", return_value=mock_browser) as mock_browser_class:
        mock_browser_class.return_value = mock_browser
        mock_browser.start = AsyncMock()
        mock_browser.close = AsyncMock()

        with patch.object(agent.client.beta.messages, "create", return_value=mock_response):
            messages = await agent.run("Test prompt", "https://example.com")

            assert len(messages) >= 1
            mock_browser.start.assert_called_once()
            mock_browser.navigate.assert_called_once_with("https://example.com")
            mock_browser.close.assert_called_once()


@pytest.mark.asyncio
async def test_agent_run_with_tool_use(agent, mock_api_key):
    """Test agent run with tool use."""
    # Mock browser
    mock_browser = AsyncMock()
    mock_browser.screenshot_to_base64 = AsyncMock(return_value="base64_screenshot")
    mock_browser.navigate = AsyncMock()

    # Mock tool use block
    mock_tool_block = Mock()
    mock_tool_block.type = "tool_use"
    mock_tool_block.id = "tool_123"
    mock_tool_block.name = "computer"
    mock_tool_block.input = {"click": {"x": 100, "y": 200}}

    # Mock response with tool use
    mock_response = MagicMock()
    mock_response.content = [mock_tool_block]

    # Mock second response (no tool use, ends conversation)
    mock_response2 = MagicMock()
    mock_response2.content = []

    with patch("src.agent.BrowserController", return_value=mock_browser) as mock_browser_class:
        mock_browser_class.return_value = mock_browser
        mock_browser.start = AsyncMock()
        mock_browser.close = AsyncMock()
        mock_browser.click = AsyncMock()

        with patch.object(
            agent.client.beta.messages, "create", side_effect=[mock_response, mock_response2]
        ):
            messages = await agent.run("Test prompt")

            # Should have at least 3 messages: initial, assistant with tool, user with result
            assert len(messages) >= 3
            mock_browser.click.assert_called_once_with(100, 200)

