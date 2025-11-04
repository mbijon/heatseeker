"""Browser automation for computer use."""

import asyncio
import base64
import io
from typing import Any, Dict, Optional

from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from PIL import Image


class BrowserController:
    """Controls a browser instance for computer use."""

    def __init__(
        self,
        headless: bool = False,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
    ):
        """Initialize browser controller.

        Args:
            headless: Whether to run browser in headless mode.
            viewport_width: Viewport width in pixels.
            viewport_height: Viewport height in pixels.
        """
        self.headless = headless
        self.viewport_width = viewport_width
        self.viewport_height = viewport_height
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

    async def start(self) -> None:
        """Start the browser."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        self.context = await self.browser.new_context(
            viewport={"width": self.viewport_width, "height": self.viewport_height}
        )
        self.page = await self.context.new_page()

    async def navigate(self, url: str) -> None:
        """Navigate to a URL.

        Args:
            url: URL to navigate to.
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        await self.page.goto(url, wait_until="networkidle")

    async def take_screenshot(self) -> bytes:
        """Take a screenshot of the current page.

        Returns:
            Screenshot as PNG bytes.
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        screenshot = await self.page.screenshot(full_page=True, type="png")
        return screenshot

    async def screenshot_to_base64(self) -> str:
        """Take a screenshot and convert to base64.

        Returns:
            Base64-encoded screenshot.
        """
        screenshot = await self.take_screenshot()
        return base64.b64encode(screenshot).decode("utf-8")

    async def click(self, x: int, y: int) -> None:
        """Click at coordinates.

        Args:
            x: X coordinate.
            y: Y coordinate.
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        await self.page.mouse.click(x, y)

    async def type_text(self, text: str) -> None:
        """Type text.

        Args:
            text: Text to type.
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        await self.page.keyboard.type(text)

    async def press_key(self, key: str) -> None:
        """Press a key.

        Args:
            key: Key to press (e.g., 'ArrowUp', 'Enter').
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        await self.page.keyboard.press(key)

    async def get_page_text(self) -> str:
        """Get all text content from the page.

        Returns:
            Page text content.
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        return await self.page.inner_text("body")

    async def close(self) -> None:
        """Close the browser."""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

