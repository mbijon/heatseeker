"""Main agent loop for Claude computer use."""

import asyncio
import json
import os
from typing import Any, Dict, List, Optional

import anthropic

from .browser import BrowserController


class ComputerUseAgent:
    """Agent that uses Claude 4.5 Sonnet to play Heatseeker via computer use."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-4-5-sonnet-20241022",
        max_iterations: int = 1000,
        display_width: int = 1920,
        display_height: int = 1080,
        headless: bool = False,
    ):
        """Initialize the computer use agent.

        Args:
            api_key: Anthropic API key. If None, reads from ANTHROPIC_API_KEY env var.
            model: Claude model to use.
            max_iterations: Maximum number of tool use iterations.
            display_width: Display width in pixels for computer use.
            display_height: Display height in pixels for computer use.
            headless: Whether to run browser in headless mode.
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set or provided as argument")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.max_iterations = max_iterations
        self.display_width = display_width
        self.display_height = display_height
        self.headless = headless
        self.beta_flag = "computer-use-2025-01-24"
        self.browser: Optional[BrowserController] = None
        self.game_url: Optional[str] = None

    async def run(
        self,
        initial_prompt: str,
        game_url: str = "https://heatseeker-one.vercel.app/",
    ) -> List[Dict[str, Any]]:
        """Run the agent loop.

        Args:
            initial_prompt: Initial prompt to give Claude.
            game_url: URL of the game to play.

        Returns:
            List of messages from the conversation.
        """
        self.game_url = game_url

        # Start browser and navigate to game
        self.browser = BrowserController(
            headless=self.headless,
            viewport_width=self.display_width,
            viewport_height=self.display_height,
        )
        await self.browser.start()
        await self.browser.navigate(game_url)

        # Take initial screenshot and include in first message
        initial_screenshot = await self.browser.screenshot_to_base64()

        messages: List[Dict[str, Any]] = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": initial_prompt},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": initial_screenshot,
                        },
                    },
                ],
            }
        ]

        tools = [
            {
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": self.display_width,
                "display_height_px": self.display_height,
                "display_number": 1,
            }
        ]

        iteration = 0
        try:
            while iteration < self.max_iterations:
                try:
                    response = self.client.beta.messages.create(
                        model=self.model,
                        max_tokens=4096,
                        messages=messages,
                        tools=tools,
                        betas=[self.beta_flag],
                    )

                    response_content = response.content
                    messages.append({"role": "assistant", "content": response_content})

                    tool_results = []
                    for block in response_content:
                        if block.type == "tool_use":
                            tool_use_id = block.id
                            tool_name = block.name

                            # Handle computer tool use
                            if tool_name == "computer":
                                tool_result = await self._handle_computer_tool(block)
                                tool_results.append(
                                    {
                                        "type": "tool_result",
                                        "tool_use_id": tool_use_id,
                                        "content": tool_result,
                                    }
                                )

                    if not tool_results:
                        # No more tool use, conversation complete
                        break

                    messages.append({"role": "user", "content": tool_results})
                    iteration += 1

                except Exception as e:
                    print(f"Error in agent loop iteration {iteration}: {e}")
                    raise
        finally:
            # Clean up browser on exit
            if self.browser:
                await self.browser.close()

        return messages

    async def _handle_computer_tool(self, block: Any) -> List[Dict[str, Any]]:
        """Handle computer tool use requests.

        Args:
            block: Tool use block from Claude.

        Returns:
            List of tool result content blocks with screenshot.
        """
        if not self.browser:
            raise RuntimeError("Browser not initialized")

        # Extract actions from the tool use block
        # The computer tool input can be a dict or JSON string
        input_data = {}
        if hasattr(block, "input"):
            if isinstance(block.input, str):
                try:
                    input_data = json.loads(block.input)
                except (json.JSONDecodeError, TypeError):
                    input_data = {}
            elif isinstance(block.input, dict):
                input_data = block.input

        # Execute actions based on tool input
        # The computer tool may specify actions in various formats
        # Common: click coordinates, type text, key presses
        if "actions" in input_data:
            actions = input_data["actions"]
            for action in actions:
                await self._execute_action(action)
        elif "click" in input_data:
            # Direct click action
            click_data = input_data["click"]
            x = click_data.get("x", 0) if isinstance(click_data, dict) else 0
            y = click_data.get("y", 0) if isinstance(click_data, dict) else 0
            await self.browser.click(x, y)
        elif "type" in input_data:
            # Direct type action
            text = input_data["type"]
            await self.browser.type_text(str(text))
        elif "key" in input_data:
            # Direct key press
            key = input_data["key"]
            await self.browser.press_key(str(key))

        # Small delay to ensure actions complete
        await asyncio.sleep(0.2)

        # Take screenshot after actions
        screenshot = await self.browser.screenshot_to_base64()

        # Return screenshot as result
        return [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": screenshot,
                },
            }
        ]

    async def _execute_action(self, action: Dict[str, Any]) -> None:
        """Execute a single action.

        Args:
            action: Action dictionary with type and parameters.
        """
        action_type = action.get("type", "")
        if action_type == "click":
            x = action.get("x", 0)
            y = action.get("y", 0)
            await self.browser.click(x, y)
        elif action_type == "type":
            text = action.get("text", "")
            await self.browser.type_text(str(text))
        elif action_type == "key_press" or action_type == "key":
            key = action.get("key", "")
            await self.browser.press_key(str(key))
        # Add small delay between actions
        await asyncio.sleep(0.1)

