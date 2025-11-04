"""Tests for browser controller."""

import asyncio
import base64
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.browser import BrowserController


@pytest.mark.asyncio
async def test_browser_initialization():
    """Test browser controller initialization."""
    controller = BrowserController(headless=True, viewport_width=1920, viewport_height=1080)
    assert controller.headless is True
    assert controller.viewport_width == 1920
    assert controller.viewport_height == 1080
    assert controller.browser is None
    assert controller.context is None
    assert controller.page is None


@pytest.mark.asyncio
async def test_browser_start():
    """Test starting the browser."""
    with patch("src.browser.async_playwright") as mock_playwright:
        mock_pw = AsyncMock()
        mock_playwright.return_value = mock_pw
        mock_browser = MagicMock()
        mock_pw.chromium.launch = AsyncMock(return_value=mock_browser)
        mock_context = MagicMock()
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_page = MagicMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)

        controller = BrowserController(headless=True)
        await controller.start()

        assert controller.playwright == mock_pw
        assert controller.browser == mock_browser
        assert controller.context == mock_context
        assert controller.page == mock_page


@pytest.mark.asyncio
async def test_browser_navigate():
    """Test navigating to a URL."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()

    await controller.navigate("https://example.com")

    controller.page.goto.assert_called_once_with("https://example.com", wait_until="networkidle")


@pytest.mark.asyncio
async def test_browser_navigate_not_started():
    """Test that navigate fails if browser not started."""
    controller = BrowserController(headless=True)

    with pytest.raises(RuntimeError, match="Browser not started"):
        await controller.navigate("https://example.com")


@pytest.mark.asyncio
async def test_browser_take_screenshot():
    """Test taking a screenshot."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()
    controller.page.screenshot = AsyncMock(return_value=b"fake_screenshot_data")

    screenshot = await controller.take_screenshot()

    assert screenshot == b"fake_screenshot_data"
    controller.page.screenshot.assert_called_once_with(full_page=True, type="png")


@pytest.mark.asyncio
async def test_browser_screenshot_to_base64():
    """Test taking a screenshot and converting to base64."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()
    controller.page.screenshot = AsyncMock(return_value=b"fake_screenshot_data")

    result = await controller.screenshot_to_base64()

    assert isinstance(result, str)
    # Decode to verify it's valid base64
    decoded = base64.b64decode(result)
    assert decoded == b"fake_screenshot_data"


@pytest.mark.asyncio
async def test_browser_click():
    """Test clicking at coordinates."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()

    await controller.click(100, 200)

    controller.page.mouse.click.assert_called_once_with(100, 200)


@pytest.mark.asyncio
async def test_browser_type_text():
    """Test typing text."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()

    await controller.type_text("test text")

    controller.page.keyboard.type.assert_called_once_with("test text")


@pytest.mark.asyncio
async def test_browser_press_key():
    """Test pressing a key."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()

    await controller.press_key("ArrowUp")

    controller.page.keyboard.press.assert_called_once_with("ArrowUp")


@pytest.mark.asyncio
async def test_browser_get_page_text():
    """Test getting page text."""
    controller = BrowserController(headless=True)
    controller.page = AsyncMock()
    controller.page.inner_text = AsyncMock(return_value="Page content")

    text = await controller.get_page_text()

    assert text == "Page content"
    controller.page.inner_text.assert_called_once_with("body")


@pytest.mark.asyncio
async def test_browser_close():
    """Test closing the browser."""
    controller = BrowserController(headless=True)
    controller.browser = AsyncMock()
    controller.playwright = AsyncMock()

    await controller.close()

    controller.browser.close.assert_called_once()
    controller.playwright.stop.assert_called_once()


@pytest.mark.asyncio
async def test_browser_context_manager():
    """Test browser as async context manager."""
    with patch("src.browser.async_playwright") as mock_playwright:
        mock_pw = AsyncMock()
        mock_playwright.return_value = mock_pw
        mock_browser = MagicMock()
        mock_pw.chromium.launch = AsyncMock(return_value=mock_browser)
        mock_context = MagicMock()
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_page = MagicMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_browser.close = AsyncMock()
        mock_pw.stop = AsyncMock()

        async with BrowserController(headless=True) as controller:
            assert controller.browser is not None
            assert controller.page is not None

        mock_browser.close.assert_called_once()
        mock_pw.stop.assert_called_once()

