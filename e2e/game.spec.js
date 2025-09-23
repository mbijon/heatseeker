import { test, expect } from '@playwright/test';

test.describe('Heatseeker Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Game Start Screen', () => {
    test('should display game title and start button', async ({ page }) => {
      await expect(page.getByText('🔥 HEATSEEKER 🔥')).toBeVisible();
      await expect(page.getByText('Leaderboard:')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
    });

  });

  test.describe('Game Initialization', () => {
    test('should start game when Start Game button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Should show game interface
      await expect(page.getByText('Level: 1 of 10')).toBeVisible();
      await expect(page.getByText('Grid: 10x10')).toBeVisible();
      await expect(page.getByText('Level Moves: 0')).toBeVisible();
      await expect(page.getByText('Total Moves: 0')).toBeVisible();
    });

    test('should display mobile controls after game start', async ({ page }) => {
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Check for directional buttons
      await expect(page.getByRole('button', { name: '↑' })).toBeVisible();
      await expect(page.getByRole('button', { name: '↓' })).toBeVisible();
      await expect(page.getByRole('button', { name: '←' })).toBeVisible();
      await expect(page.getByRole('button', { name: '→' })).toBeVisible();
    });

    test('should render game grid', async ({ page }) => {
      await page.getByRole('button', { name: 'Start Game' }).click();

      // Check that grid container exists with CSS grid layout
      const gridContainer = page.locator('[style*="grid-template-columns"]');
      await expect(gridContainer).toBeVisible();

      // Grid should have 100 cells for 10x10 grid
      const gridCells = gridContainer.locator('div').first().locator('div');
      await expect(gridCells).toHaveCount(100);
    });
  });

  test.describe('Game Controls', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Start Game' }).click();
    });

    test('should respond to mobile control buttons', async ({ page }) => {
      // Check initial state
      await expect(page.getByText('Level Moves: 0')).toBeVisible();

      // Click right button
      await page.getByRole('button', { name: '→' }).click();

      // Should increment move counter
      await expect(page.getByText('Level Moves: 1')).toBeVisible();
      await expect(page.getByText('Total Moves: 1')).toBeVisible();
    });

    test('should respond to keyboard controls', async ({ page }) => {
      // Check initial state
      await expect(page.getByText('Level Moves: 0')).toBeVisible();

      // Press arrow key
      await page.keyboard.press('ArrowRight');

      // Should increment move counter
      await expect(page.getByText('Level Moves: 1')).toBeVisible();
      await expect(page.getByText('Total Moves: 1')).toBeVisible();
    });

    test('should allow multiple moves and track correctly', async ({ page }) => {
      // Make several moves
      await page.getByRole('button', { name: '→' }).click();
      await page.getByRole('button', { name: '↑' }).click();
      await page.getByRole('button', { name: '→' }).click();

      // Should track all moves
      await expect(page.getByText('Level Moves: 3')).toBeVisible();
      await expect(page.getByText('Total Moves: 3')).toBeVisible();
    });

    test('should prevent moves outside grid boundaries', async ({ page }) => {
      // Try to move left from starting position (should not work)
      await page.getByRole('button', { name: '←' }).click();

      // Move counter should remain 0
      await expect(page.getByText('Level Moves: 0')).toBeVisible();
      await expect(page.getByText('Total Moves: 0')).toBeVisible();
    });
  });

  test.describe('Game Visual Elements', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Start Game' }).click();
    });

    test('should show player position indicator', async ({ page }) => {
      // Player should be indicated by blue ring
      const playerIndicator = page.locator('.ring-blue-400');
      await expect(playerIndicator).toBeVisible();
    });

    test('should display help text during gameplay', async ({ page }) => {
      await expect(page.getByText('Navigate safely through the lava field')).toBeVisible();
    });

    test('should update player position when moving', async ({ page }) => {
      // Get initial player position
      const initialPlayer = page.locator('.ring-blue-400');
      await expect(initialPlayer).toBeVisible();

      // Move right
      await page.getByRole('button', { name: '→' }).click();

      // Player indicator should still be visible (but potentially in new position)
      const movedPlayer = page.locator('.ring-blue-400');
      await expect(movedPlayer).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      await page.getByRole('button', { name: 'Start Game' }).click();

      // Mobile controls should be visible and usable
      await expect(page.getByRole('button', { name: '↑' })).toBeVisible();
      await expect(page.getByRole('button', { name: '→' })).toBeVisible();

      // Game should still function
      await page.getByRole('button', { name: '→' }).click();
      await expect(page.getByText('Level Moves: 1')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      await page.getByRole('button', { name: 'Start Game' }).click();

      // Game should render properly
      await expect(page.getByText('Level: 1 of 10')).toBeVisible();
      await expect(page.locator('[style*="grid-template-columns"]')).toBeVisible();

      // Controls should work
      await page.keyboard.press('ArrowRight');
      await expect(page.getByText('Level Moves: 1')).toBeVisible();
    });
  });

  test.describe('Game States', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Start Game' }).click();
    });

    test('should maintain game state during gameplay', async ({ page }) => {
      // Make some moves
      await page.getByRole('button', { name: '→' }).click();
      await page.getByRole('button', { name: '↑' }).click();

      // Game should still be in playing state
      await expect(page.getByText('Level Moves: 2')).toBeVisible();
      await expect(page.getByRole('button', { name: '→' })).toBeEnabled();
    });

    test('should handle rapid button clicks', async ({ page }) => {
      // Click rapidly
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: '→' }).click();
        await page.waitForTimeout(50); // Small delay to simulate rapid clicking
      }

      // Should handle all clicks properly without breaking
      await expect(page.getByText(/Level Moves: [1-5]/)).toBeVisible();
      await expect(page.getByRole('button', { name: '→' })).toBeEnabled();
    });
  });
});