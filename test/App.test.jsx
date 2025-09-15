import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'

// Mock the game logic to make tests deterministic
vi.mock('../src/gameLogic.js', () => ({
  levels: [
    { size: 10, minLava: 1, maxLava: 5 },
    { size: 10, minLava: 5, maxLava: 15 }
  ],
  calculateHeat: vi.fn((x, y, lavaSet) => {
    // Mock implementation - return 1 if adjacent to any lava
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const checkKey = `${x + dx},${y + dy}`
        if (lavaSet.has(checkKey)) return 1
      }
    }
    return 0
  }),
  generateLavaSquares: vi.fn(() => new Set(['5,5', '6,6'])),
  isValidMove: vi.fn((pos, direction, gridSize) => {
    let newX = pos.x
    let newY = pos.y

    switch (direction) {
      case 'up': newY = Math.max(0, pos.y - 1); break
      case 'down': newY = Math.min(gridSize - 1, pos.y + 1); break
      case 'left': newX = Math.max(0, pos.x - 1); break
      case 'right': newX = Math.min(gridSize - 1, pos.x + 1); break
    }

    const moved = newX !== pos.x || newY !== pos.y
    return { valid: moved, newPos: { x: newX, y: newY } }
  }),
  isTargetPosition: vi.fn((pos, gridSize) => pos.x === gridSize - 1 && pos.y === 0),
  isLavaPosition: vi.fn((pos, lavaSet) => lavaSet.has(`${pos.x},${pos.y}`)),
  getHeatColor: vi.fn((count) => count === 0 ? 'bg-gray-300' : 'bg-yellow-200')
}))

describe('Heatseeker Game Component', () => {
  describe('Initial Game State', () => {
    it('should render start screen with game title', () => {
      render(<App />)

      expect(screen.getByText('🔥 HEATSEEKER 🔥')).toBeInTheDocument()
      expect(screen.getByText('Leaderboard:')).toBeInTheDocument()
      expect(screen.getByText('Start Game')).toBeInTheDocument()
    })
  })

  describe('Game Start', () => {
    it('should start game when Start Game button is clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      const startButton = screen.getByText('Start Game')
      await user.click(startButton)

      // Should show game grid and level info
      expect(screen.getByText('Level: 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('Grid: 10x10')).toBeInTheDocument()
      expect(screen.getByText('Level Moves: 0')).toBeInTheDocument()
      expect(screen.getByText('Total Moves: 0')).toBeInTheDocument()
    })

    it('should display mobile controls after starting game', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Start Game'))

      expect(screen.getByText('↑')).toBeInTheDocument()
      expect(screen.getByText('↓')).toBeInTheDocument()
      expect(screen.getByText('←')).toBeInTheDocument()
      expect(screen.getByText('→')).toBeInTheDocument()
    })
  })

  describe('Game Controls', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<App />)
      await user.click(screen.getByText('Start Game'))
    })

    it('should respond to mobile control buttons', async () => {
      const user = userEvent.setup()

      const initialMoves = screen.getByText('Level Moves: 0')
      expect(initialMoves).toBeInTheDocument()

      // Click up button
      const upButton = screen.getByText('↑')
      await user.click(upButton)

      // Should increment move counter
      await waitFor(() => {
        expect(screen.getByText('Level Moves: 1')).toBeInTheDocument()
        expect(screen.getByText('Total Moves: 1')).toBeInTheDocument()
      })
    })

    it('should respond to keyboard controls', async () => {
      const user = userEvent.setup()

      // Focus on the document body to ensure keyboard events work
      document.body.focus()

      // Press arrow key
      await user.keyboard('{ArrowRight}')

      // Should increment move counter
      await waitFor(() => {
        expect(screen.getByText('Level Moves: 1')).toBeInTheDocument()
        expect(screen.getByText('Total Moves: 1')).toBeInTheDocument()
      })
    })
  })

  describe('Game Grid', () => {
    it('should render game grid after starting', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Start Game'))

      // Look for grid container
      const gridContainer = document.querySelector('[style*="grid-template-columns"]')
      expect(gridContainer).toBeInTheDocument()

      // Should have correct number of grid cells (10x10 = 100 cells)
      const gridCells = gridContainer.children
      expect(gridCells).toHaveLength(100)
    })

    it('should show player position with blue ring', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Start Game'))

      // Player starts at bottom-left, should have blue ring
      const playerCell = document.querySelector('.ring-blue-400')
      expect(playerCell).toBeInTheDocument()
    })
  })

  describe('Move Counter', () => {
    it('should increment move counters when player moves', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Start Game'))

      // Make several moves
      const rightButton = screen.getByText('→')
      await user.click(rightButton)
      await user.click(rightButton)

      await waitFor(() => {
        expect(screen.getByText('Level Moves: 2')).toBeInTheDocument()
        expect(screen.getByText('Total Moves: 2')).toBeInTheDocument()
      })
    })
  })

  describe('Game Instructions', () => {
    it('should show help text during gameplay', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByText('Start Game'))

      expect(screen.getByText('Navigate safely through the lava field using heat signatures to detect danger!')).toBeInTheDocument()
    })

  })
})