import { test, expect } from '@playwright/test';

const VERY_SMALL_VIEWPORT = { width: 320, height: 568 }; // iPhone SE baseline
const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone 8/X baseline
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };

async function getButtonMetrics(locator) {
  return locator.evaluate(element => {
    const styles = window.getComputedStyle(element);
    const parsePx = value => parseFloat(value.replace('px', ''));

    return {
      fontSize: parseFloat(styles.fontSize),
      fontWeight: parseFloat(styles.fontWeight),
      paddingX: parsePx(styles.paddingLeft) + parsePx(styles.paddingRight),
      paddingY: parsePx(styles.paddingTop) + parsePx(styles.paddingBottom),
      borderRadius: parsePx(styles.borderTopLeftRadius)
    };
  });
}

test.describe('Responsive Layout Expectations', () => {
  test('grid provides scroll containment on ultra small viewports', async ({ page }) => {
    await page.setViewportSize(VERY_SMALL_VIEWPORT);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    const grid = page.locator('[data-testid="game-grid"]');
    await expect(grid).toBeVisible();

    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();
    if (gridBox) {
      expect(gridBox.width).toBeLessThanOrEqual(VERY_SMALL_VIEWPORT.width - 16);
    }

    const overflowY = await grid.evaluate(element => window.getComputedStyle(element).overflowY);
    expect(['auto', 'scroll']).toContain(overflowY);
  });

  test('direction pad shrinks and aligns left on compact screens', async ({ page, browser }) => {
    const desktopContext = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('/');
    await desktopPage.getByRole('button', { name: 'Start Game' }).click();
    const desktopMetrics = await getButtonMetrics(desktopPage.getByRole('button', { name: '↑' }));
    await desktopContext.close();

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    const mobileUpButton = page.getByRole('button', { name: '↑' });
    const mobileMetrics = await getButtonMetrics(mobileUpButton);

    expect(mobileMetrics.fontSize).toBeLessThanOrEqual(desktopMetrics.fontSize * 0.8);
    expect(mobileMetrics.paddingX).toBeLessThanOrEqual(desktopMetrics.paddingX * 0.85);
    expect(mobileMetrics.paddingY).toBeLessThanOrEqual(desktopMetrics.paddingY * 0.85);

    const moveControls = page.locator('[data-testid="move-controls"]');
    const alignItems = await moveControls.evaluate(element => window.getComputedStyle(element).alignItems);
    expect(alignItems).toBe('flex-start');

    const controlsBox = await moveControls.boundingBox();
    const buttonBox = await mobileUpButton.boundingBox();
    expect(controlsBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    if (controlsBox && buttonBox) {
      expect(buttonBox.x - controlsBox.x).toBeLessThanOrEqual(8);
    }
  });

  test('bailout button matches start button styling and floats right on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');

    const startButton = page.getByRole('button', { name: 'Start Game' });
    const startMetrics = await getButtonMetrics(startButton);

    await startButton.click();

    const bailoutButton = page.getByRole('button', { name: 'Bailout' });
    const bailoutMetrics = await getButtonMetrics(bailoutButton);

    expect(bailoutMetrics.fontSize).toBeCloseTo(startMetrics.fontSize, 0);
    expect(bailoutMetrics.paddingX).toBeCloseTo(startMetrics.paddingX, 0);
    expect(bailoutMetrics.paddingY).toBeCloseTo(startMetrics.paddingY, 0);
    expect(bailoutMetrics.borderRadius).toBeCloseTo(startMetrics.borderRadius, 0);
    expect(bailoutMetrics.fontWeight).toBeCloseTo(startMetrics.fontWeight, 0);

    const directionPad = page.locator('[data-testid="direction-pad"]');
    const directionPadBox = await directionPad.boundingBox();
    const bailoutBox = await bailoutButton.boundingBox();
    expect(directionPadBox).not.toBeNull();
    expect(bailoutBox).not.toBeNull();
    if (directionPadBox && bailoutBox) {
      expect(bailoutBox.y - directionPadBox.y).toBeLessThanOrEqual(directionPadBox.height * 0.25);
      expect(bailoutBox.x).toBeGreaterThan(directionPadBox.x + directionPadBox.width);
    }

    const bailoutPanel = page.locator('[data-testid="bailout-panel"]');
    const panelAlignment = await bailoutPanel.evaluate(element => window.getComputedStyle(element).alignItems);
    expect(panelAlignment).toBe('flex-end');
  });
});
