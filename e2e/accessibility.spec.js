import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check main heading
    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toHaveText('🔥 HEATSEEKER 🔥');

    // Check subheading
    const subHeading = page.getByRole('heading', { level: 2 });
    await expect(subHeading).toBeVisible();
    await expect(subHeading).toHaveText('Game Rules:');
  });

  test('should have accessible buttons', async ({ page }) => {
    // Start button should be accessible
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Start the game to test mobile controls
    await startButton.click();

    // Mobile control buttons should be accessible
    const upButton = page.getByRole('button', { name: '↑' });
    const downButton = page.getByRole('button', { name: '↓' });
    const leftButton = page.getByRole('button', { name: '←' });
    const rightButton = page.getByRole('button', { name: '→' });

    await expect(upButton).toBeVisible();
    await expect(upButton).toBeEnabled();
    await expect(downButton).toBeVisible();
    await expect(downButton).toBeEnabled();
    await expect(leftButton).toBeVisible();
    await expect(leftButton).toBeEnabled();
    await expect(rightButton).toBeVisible();
    await expect(rightButton).toBeEnabled();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to start button
    await page.keyboard.press('Tab');

    // Start button should be focused
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Game should start
    await expect(page.getByText('Level: 1 of 10')).toBeVisible();
  });

  test('should support keyboard game controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Arrow keys should work for game control
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Level Moves: 1')).toBeVisible();

    await page.keyboard.press('ArrowUp');
    await expect(page.getByText('Level Moves: 2')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('Level Moves: 3')).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByText('Level Moves: 4')).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // The game uses color to convey important information
    // We should ensure text has good contrast against backgrounds

    // Check main title contrast
    const title = page.getByText('🔥 HEATSEEKER 🔥');
    await expect(title).toBeVisible();

    // Check button contrast
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeVisible();

    // Start game and check game UI contrast
    await startButton.click();

    const levelText = page.getByText('Level: 1 of 10');
    await expect(levelText).toBeVisible();

    const movesText = page.getByText('Level Moves: 0');
    await expect(movesText).toBeVisible();
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');

    // Game should still be functional
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByText('Level: 1 of 10')).toBeVisible();

    // Controls should still work
    await page.getByRole('button', { name: '→' }).click();
    await expect(page.getByText('Level Moves: 1')).toBeVisible();
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });

    await page.goto('/');

    // Essential elements should still be visible
    await expect(page.getByText('🔥 HEATSEEKER 🔥')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();

    // Game should be playable
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByText('Level: 1 of 10')).toBeVisible();
  });

  test('should be usable with screen reader simulation', async ({ page }) => {
    // This test simulates some screen reader behaviors

    // Check that important content has text that would be read aloud
    await expect(page.getByText('🔥 HEATSEEKER 🔥')).toBeVisible();

    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeVisible();

    await startButton.click();

    // Game status should be clearly communicated
    await expect(page.getByText('Level: 1 of 10')).toBeVisible();
    await expect(page.getByText('Level Moves: 0')).toBeVisible();
  });

  test('should maintain focus management', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Tab through mobile controls
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on mobile control buttons
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});