"""
Unit tests for the Claude computer use agent.
"""

import json
import unittest
from unittest.mock import MagicMock, patch

from src.agent import ComputerUseAgent, MODEL, COMPUTER_USE_BETA


class TestComputerUseAgent(unittest.TestCase):
    """Test cases for ComputerUseAgent class."""

    def setUp(self):
        """Set up test fixtures."""
        self.agent = ComputerUseAgent(api_key="test-key", max_iterations=10)

    def test_agent_initialization(self):
        """Test that agent initializes with correct settings."""
        self.assertEqual(self.agent.max_iterations, 10)
        self.assertEqual(self.agent.iteration_count, 0)
        self.assertEqual(len(self.agent.conversation_history), 0)

    @patch("src.agent.anthropic.Anthropic")
    def test_agent_initializes_with_beta_header(self, mock_anthropic_class):
        """Test that agent initializes client with correct beta header."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        agent = ComputerUseAgent(api_key="test-key")

        # Verify Anthropic client was initialized with the correct parameters
        mock_anthropic_class.assert_called_once()
        call_kwargs = mock_anthropic_class.call_args[1]
        self.assertEqual(call_kwargs["api_key"], "test-key")
        self.assertIn("default_headers", call_kwargs)
        self.assertEqual(call_kwargs["default_headers"]["anthropic-beta"], COMPUTER_USE_BETA)

    def test_create_screenshot_content_block(self):
        """Test creation of screenshot content block."""
        test_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        content_block = self.agent.create_screenshot_content_block(test_base64)

        self.assertEqual(content_block["type"], "image")
        self.assertEqual(content_block["source"]["type"], "base64")
        self.assertEqual(content_block["source"]["media_type"], "image/png")
        self.assertEqual(content_block["source"]["data"], test_base64)

    @patch("src.agent.anthropic.Anthropic")
    def test_run_with_mocked_api(self, mock_anthropic_class):
        """Test agent run with mocked API."""
        # Create mock client and response
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        # Mock API response that ends immediately
        mock_response = MagicMock()
        mock_response.stop_reason = "end_turn"
        mock_response.content = [
            {
                "type": "text",
                "text": "I understand the task. Starting to play the game.",
            }
        ]

        mock_client.messages.create.return_value = mock_response

        agent = ComputerUseAgent(api_key="test-key")

        # Mock screenshot taking
        with patch.object(agent, "take_screenshot", return_value="test_base64_data"):
            with patch.object(agent, "process_tool_use", return_value="Tool executed"):
                result = agent.run(
                    initial_prompt="Test prompt",
                    url="https://heatseeker-one.vercel.app/",
                )

        self.assertEqual(result["status"], "completed")
        self.assertGreaterEqual(result["iterations"], 1)

    def test_process_tool_use_with_screenshot_action(self):
        """Test processing screenshot action."""
        tool_use = {
            "name": "computer",
            "input": {
                "action": "screenshot",
            },
        }

        with patch("src.agent.sync_playwright"):
            result = self.agent.process_tool_use(tool_use)
            self.assertEqual(result, "Screenshot taken")

    def test_process_tool_use_with_click_action(self):
        """Test processing click action."""
        tool_use = {
            "name": "computer",
            "input": {
                "action": "click",
                "coordinate": [640, 480],
            },
        }

        with patch("src.agent.sync_playwright") as mock_playwright:
            mock_page = MagicMock()
            mock_context = MagicMock()
            mock_context.__enter__.return_value.chromium.launch.return_value.new_page.return_value = mock_page
            mock_playwright.return_value.__enter__.return_value = mock_context

            result = self.agent.process_tool_use(tool_use)
            self.assertIn("Clicked at (640, 480)", result)

    def test_process_tool_use_with_type_action(self):
        """Test processing type action."""
        tool_use = {
            "name": "computer",
            "input": {
                "action": "type",
                "text": "test input",
            },
        }

        with patch("src.agent.sync_playwright"):
            result = self.agent.process_tool_use(tool_use)
            self.assertIn("Typed: test input", result)

    def test_process_tool_use_with_key_action(self):
        """Test processing key press action."""
        tool_use = {
            "name": "computer",
            "input": {
                "action": "key",
                "key": "Enter",
            },
        }

        with patch("src.agent.sync_playwright"):
            result = self.agent.process_tool_use(tool_use)
            self.assertIn("Pressed key: Enter", result)

    def test_process_tool_use_with_scroll_action(self):
        """Test processing scroll action."""
        tool_use = {
            "name": "computer",
            "input": {
                "action": "scroll",
                "coordinate": [640, 400],
                "direction": "down",
                "amount": 3,
            },
        }

        with patch("src.agent.sync_playwright"):
            result = self.agent.process_tool_use(tool_use)
            self.assertIn("Scrolled down by 3 units", result)

    def test_process_tool_use_with_unknown_action(self):
        """Test processing unknown action."""
        tool_use = {
            "name": "computer",
            "input": {
                "action": "unknown_action",
            },
        }

        with patch("src.agent.sync_playwright"):
            result = self.agent.process_tool_use(tool_use)
            self.assertIn("Unknown action", result)

    def test_conversation_history_tracking(self):
        """Test that conversation history is properly tracked."""
        self.assertEqual(len(self.agent.conversation_history), 0)

        test_entry = {"role": "assistant", "content": [{"type": "text", "text": "test"}]}
        self.agent.conversation_history.append(test_entry)

        self.assertEqual(len(self.agent.conversation_history), 1)
        self.assertEqual(self.agent.conversation_history[0]["role"], "assistant")

    @patch("src.agent.anthropic.Anthropic")
    def test_run_with_tool_use_response(self, mock_anthropic_class):
        """Test agent handles tool use responses correctly."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        # Mock response with tool use
        mock_response = MagicMock()
        mock_response.stop_reason = "tool_use"
        tool_use_block = MagicMock()
        tool_use_block.type = "tool_use"
        tool_use_block.name = "computer"
        tool_use_block.id = "test_id"
        tool_use_block.input = {"action": "screenshot"}
        mock_response.content = [tool_use_block]

        # First call returns tool_use, second call returns end_turn
        end_response = MagicMock()
        end_response.stop_reason = "end_turn"
        end_response.content = [{"type": "text", "text": "Task complete"}]

        mock_client.messages.create.side_effect = [mock_response, end_response]

        agent = ComputerUseAgent(api_key="test-key", max_iterations=10)

        with patch.object(agent, "take_screenshot", return_value="test_data"):
            with patch.object(agent, "process_tool_use", return_value="Action executed"):
                result = agent.run(initial_prompt="Test")

        self.assertEqual(result["status"], "completed")

    @patch("src.agent.anthropic.Anthropic")
    def test_run_max_iterations(self, mock_anthropic_class):
        """Test that agent stops at max iterations."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        # Mock response that always requests tool use
        mock_response = MagicMock()
        mock_response.stop_reason = "tool_use"
        tool_use_block = MagicMock()
        tool_use_block.type = "tool_use"
        tool_use_block.name = "computer"
        tool_use_block.id = "test_id"
        tool_use_block.input = {"action": "screenshot"}
        mock_response.content = [tool_use_block]

        mock_client.messages.create.return_value = mock_response

        agent = ComputerUseAgent(api_key="test-key", max_iterations=3)

        with patch.object(agent, "take_screenshot", return_value="test_data"):
            with patch.object(agent, "process_tool_use", return_value="Action"):
                result = agent.run(initial_prompt="Test")

        self.assertEqual(result["status"], "max_iterations_reached")
        self.assertEqual(result["iterations"], 3)


class TestComputerUseConfiguration(unittest.TestCase):
    """Test configuration constants."""

    def test_model_name(self):
        """Test that the correct model is configured."""
        self.assertIn("sonnet", MODEL.lower())

    def test_beta_flag(self):
        """Test that beta flag is properly set."""
        self.assertEqual(COMPUTER_USE_BETA, "computer-use-2025-01-24")


if __name__ == "__main__":
    unittest.main()
