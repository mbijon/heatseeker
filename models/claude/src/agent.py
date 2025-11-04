"""
Claude 4.5 Sonnet Computer Use Agent for Heatseeker Game

This module implements an autonomous agent that uses Claude's computer use
capabilities to learn and play the Heatseeker game.
"""

import base64
import json
import os
import time
from pathlib import Path
from typing import Optional

import anthropic
from PIL import Image

# Model and API Configuration
MODEL = "claude-sonnet-4-20250514"
COMPUTER_USE_BETA = "computer-use-2025-01-24"
DISPLAY_WIDTH = 1280
DISPLAY_HEIGHT = 800


class ComputerUseAgent:
    """
    An agent that uses Claude 4.5 Sonnet's computer use capabilities
    to autonomously play the Heatseeker game.
    """

    def __init__(self, api_key: Optional[str] = None, max_iterations: int = 100):
        """
        Initialize the computer use agent.

        Args:
            api_key: Anthropic API key. If None, will use ANTHROPIC_API_KEY env var.
            max_iterations: Maximum number of iterations before stopping.
        """
        self.client = anthropic.Anthropic(
            api_key=api_key,
            default_headers={"anthropic-beta": COMPUTER_USE_BETA}
        )
        self.max_iterations = max_iterations
        self.iteration_count = 0
        self.conversation_history: list[dict] = []

    def take_screenshot(self, url: str = "https://heatseeker-one.vercel.app/") -> str:
        """
        Take a screenshot of the game using Playwright.

        Args:
            url: URL to screenshot

        Returns:
            Base64 encoded PNG image string
        """
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise ImportError(
                "Playwright is required for screenshot functionality. "
                "Install with: pip install playwright"
            )

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(
                viewport={"width": DISPLAY_WIDTH, "height": DISPLAY_HEIGHT}
            )
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(2000)  # Wait for game to fully load

            screenshot_path = "/tmp/heatseeker_screenshot.png"
            page.screenshot(path=screenshot_path)
            browser.close()

            # Convert to base64
            with open(screenshot_path, "rb") as f:
                image_data = base64.standard_b64encode(f.read()).decode("utf-8")

            return image_data

    def create_screenshot_content_block(self, screenshot_base64: str) -> dict:
        """
        Create an image content block for the API.

        Args:
            screenshot_base64: Base64 encoded screenshot

        Returns:
            Content block dictionary
        """
        return {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": screenshot_base64,
            },
        }

    def process_tool_use(
        self, tool_use: dict, url: str = "https://heatseeker-one.vercel.app/"
    ) -> str:
        """
        Process a tool use request from Claude and execute it.

        Args:
            tool_use: Tool use block from Claude's response
            url: URL to interact with

        Returns:
            Result string to send back to Claude
        """
        tool_name = tool_use.get("name", "")
        tool_input = tool_use.get("input", {})

        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise ImportError(
                "Playwright is required for tool execution. "
                "Install with: pip install playwright"
            )

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(
                viewport={"width": DISPLAY_WIDTH, "height": DISPLAY_HEIGHT}
            )
            page.goto(url, wait_until="networkidle")

            result = ""

            if tool_name == "computer":
                action = tool_input.get("action")

                if action == "screenshot":
                    result = "Screenshot taken"

                elif action == "click":
                    x = tool_input.get("coordinate", [0, 0])[0]
                    y = tool_input.get("coordinate", [0, 0])[1]
                    page.mouse.click(x, y)
                    result = f"Clicked at ({x}, {y})"

                elif action == "type":
                    text = tool_input.get("text", "")
                    page.keyboard.type(text)
                    result = f"Typed: {text}"

                elif action == "key":
                    key = tool_input.get("key", "")
                    page.keyboard.press(key)
                    result = f"Pressed key: {key}"

                elif action == "scroll":
                    coordinate = tool_input.get("coordinate", [640, 400])
                    direction = tool_input.get("direction", "down")
                    amount = tool_input.get("amount", 3)

                    x, y = coordinate[0], coordinate[1]
                    page.mouse.move(x, y)

                    if direction == "up":
                        amount = -amount

                    page.mouse.wheel(0, amount * 100)
                    result = f"Scrolled {direction} by {amount} units"

                else:
                    result = f"Unknown action: {action}"

            browser.close()
            page.wait_for_timeout(1000)

        return result

    def run(
        self,
        initial_prompt: str = 'I would like you to learn to play this game: https://heatseeker-one.vercel.app/. If you successfully reach a Leaderboard score, please enter your name as "Claude 4.5". Keep playing until you complete level 10.',
        url: str = "https://heatseeker-one.vercel.app/",
    ) -> dict:
        """
        Run the agent loop to play the game.

        Args:
            initial_prompt: The initial instruction for Claude
            url: URL of the game

        Returns:
            Dictionary containing final status and conversation history
        """
        # Reset state
        self.iteration_count = 0
        self.conversation_history = []

        # Define the computer use tool
        tools = [
            {
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": DISPLAY_WIDTH,
                "display_height_px": DISPLAY_HEIGHT,
            }
        ]

        # Initial message
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": initial_prompt,
                    }
                ],
            }
        ]

        print(f"Starting agent loop with prompt: {initial_prompt}")
        print(f"Max iterations: {self.max_iterations}")

        while self.iteration_count < self.max_iterations:
            self.iteration_count += 1
            print(f"\n=== Iteration {self.iteration_count} ===")

            try:
                # Take screenshot
                screenshot = self.take_screenshot(url)
                messages[-1]["content"].append(self.create_screenshot_content_block(screenshot))

                # Call Claude API with computer use enabled
                response = self.client.messages.create(
                    model=MODEL,
                    max_tokens=4096,
                    tools=tools,
                    messages=messages,
                )

                print(f"Response stop_reason: {response.stop_reason}")

                # Add assistant response to history
                self.conversation_history.append(
                    {"role": "assistant", "content": response.content}
                )

                # Check if we should continue
                if response.stop_reason == "end_turn":
                    print("Agent completed task")
                    return {
                        "status": "completed",
                        "iterations": self.iteration_count,
                        "conversation_history": self.conversation_history,
                    }

                # Process tool uses
                if response.stop_reason == "tool_use":
                    tool_results = []

                    for block in response.content:
                        if block.type == "tool_use":
                            print(f"Tool use: {block.name}")
                            result = self.process_tool_use(
                                {
                                    "name": block.name,
                                    "input": block.input,
                                },
                                url,
                            )
                            print(f"Tool result: {result}")

                            tool_results.append(
                                {
                                    "type": "tool_result",
                                    "tool_use_id": block.id,
                                    "content": result,
                                }
                            )

                    # Add user response with tool results
                    messages.append({"role": "assistant", "content": response.content})
                    messages.append(
                        {
                            "role": "user",
                            "content": tool_results,
                        }
                    )

                    # Rate limiting
                    time.sleep(1)

            except anthropic.APIError as e:
                print(f"API Error: {e}")
                return {
                    "status": "error",
                    "error": str(e),
                    "iterations": self.iteration_count,
                    "conversation_history": self.conversation_history,
                }

        return {
            "status": "max_iterations_reached",
            "iterations": self.iteration_count,
            "conversation_history": self.conversation_history,
        }


def main():
    """Main entry point for the agent."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is required")

    agent = ComputerUseAgent(api_key=api_key, max_iterations=100)

    result = agent.run(
        initial_prompt='I would like you to learn to play this game: https://heatseeker-one.vercel.app/. If you successfully reach a Leaderboard score, please enter your name as "Claude 4.5". Keep playing until you complete level 10.',
        url="https://heatseeker-one.vercel.app/",
    )

    print("\n=== Final Result ===")
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
