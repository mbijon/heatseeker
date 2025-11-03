"""Shared pytest fixtures for the Claude integration tests."""
from __future__ import annotations

import pytest
from playwright.sync_api import Browser, Page, sync_playwright, Error


@pytest.fixture(scope="session")
def browser() -> Browser:
    with sync_playwright() as playwright:
        browser: Browser | None = None
        try:
            browser = playwright.chromium.launch()
        except Error as exc:
            pytest.skip(f"Playwright Chromium browser is unavailable: {exc}")
        try:
            yield browser
        finally:
            if browser is not None:
                browser.close()


@pytest.fixture()
def page(browser: Browser) -> Page:
    page = browser.new_page()
    try:
        yield page
    finally:
        page.close()
