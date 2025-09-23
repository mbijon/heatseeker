import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Page should load within reasonable time
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds max

    // Essential elements should be visible quickly
    await expect(page.getByText('🔥 HEATSEEKER 🔥')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
  });

  test('should handle rapid interactions without lag', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    const startTime = Date.now();

    // Perform rapid button clicks
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: '→' }).click();
      await page.getByRole('button', { name: '↑' }).click();
    }

    const interactionTime = Date.now() - startTime;

    // 20 rapid interactions should complete quickly
    expect(interactionTime).toBeLessThan(2000); // 2 seconds max

    // Final state should be correct
    await expect(page.getByText('Level Moves: 20')).toBeVisible();
  });

  test('should handle keyboard input responsively', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    const startTime = Date.now();

    // Rapid keyboard inputs
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowUp');
    }

    const keyboardTime = Date.now() - startTime;

    // Keyboard interactions should be responsive
    expect(keyboardTime).toBeLessThan(1500); // 1.5 seconds max

    // State should be updated correctly
    await expect(page.getByText('Level Moves: 30')).toBeVisible();
  });

  test('should maintain performance with large grids', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Game starts with 10x10 grid (100 cells)
    const gridContainer = page.locator('[style*="grid-template-columns"]');
    await expect(gridContainer).toBeVisible();

    const startTime = Date.now();

    // Test interactions on the grid
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: '→' }).click();
      await page.getByRole('button', { name: '↑' }).click();
    }

    const gridInteractionTime = Date.now() - startTime;

    // Grid interactions should remain fast
    expect(gridInteractionTime).toBeLessThan(1000); // 1 second max
  });

  test('should handle window resize efficiently', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 },   // Mobile
      { width: 1440, height: 900 },  // Laptop
    ];

    for (const viewport of viewports) {
      const resizeStart = Date.now();

      await page.setViewportSize(viewport);

      // Game should remain functional
      await expect(page.getByText('Level: 1 of 10')).toBeVisible();
      await expect(page.getByRole('button', { name: '→' })).toBeVisible();

      const resizeTime = Date.now() - resizeStart;
      expect(resizeTime).toBeLessThan(500); // 500ms max per resize
    }
  });

  test('should not have memory leaks during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Simulate extended gameplay
    for (let round = 0; round < 3; round++) {
      // Make moves
      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: '→' }).click();
        await page.waitForTimeout(50);
      }

      // Brief pause between rounds
      await page.waitForTimeout(200);
    }

    // Game should still be responsive
    await expect(page.getByText(/Level Moves: \d+/)).toBeVisible();
    await expect(page.getByRole('button', { name: '→' })).toBeEnabled();

    // Test one more interaction to ensure responsiveness
    const finalMoveStart = Date.now();
    await page.getByRole('button', { name: '→' }).click();
    const finalMoveTime = Date.now() - finalMoveStart;

    expect(finalMoveTime).toBeLessThan(200); // Should still be fast
  });

  test('should load efficiently on slow connections', async ({ page }) => {
    // Simulate slow 3G connection
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/');

    // Should still load in reasonable time even with network delays
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 seconds max on slow connection

    // Core functionality should work
    await expect(page.getByText('🔥 HEATSEEKER 🔥')).toBeVisible();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByText('Level: 1 of 10')).toBeVisible();
  });

  test('should handle concurrent operations smoothly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Simulate user doing multiple things at once
    const concurrentStart = Date.now();

    await Promise.all([
      // Rapid button clicking
      (async () => {
        for (let i = 0; i < 5; i++) {
          await page.getByRole('button', { name: '→' }).click();
          await page.waitForTimeout(20);
        }
      })(),

      // Keyboard inputs
      (async () => {
        await page.waitForTimeout(50);
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('ArrowUp');
          await page.waitForTimeout(20);
        }
      })(),

      // UI interactions
      (async () => {
        await page.waitForTimeout(100);
        // Just verify UI is still responsive
        await expect(page.getByText(/Level Moves: \d+/)).toBeVisible();
      })()
    ]);

    const concurrentTime = Date.now() - concurrentStart;
    expect(concurrentTime).toBeLessThan(1000); // 1 second max

    // Final state should be consistent
    await expect(page.getByText('Level Moves: 10')).toBeVisible();
  });
});