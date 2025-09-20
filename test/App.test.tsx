import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Heatseeker from '../src/App'
import type { Position, LavaSquares } from '../src/types'

const gameLogicMocks = vi.hoisted(() => {
  const generateLavaSquaresMock = vi.fn((): LavaSquares => new Set(['5,5', '6,6']))
  const calculateHeatMock = vi.fn((x: number, y: number, lavaSet: LavaSquares): number => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const checkKey = `${x + dx},${y + dy}`
        if (lavaSet.has(checkKey)) return 1
      }
    }
    return 0
  })
  const getHeatColorMock = vi.fn((count: number): string =>
    count === 0 ? 'bg-gray-300' : 'bg-yellow-200'
  )
  const isValidMoveMock = vi.fn((pos: Position, direction: string, gridSize: number) => {
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
  })
  const isTargetPositionMock = vi.fn((pos: Position, gridSize: number): boolean =>
    pos.x === gridSize - 1 && pos.y === 0
  )
  const isLavaPositionMock = vi.fn((pos: Position, lavaSet: LavaSquares): boolean =>
    lavaSet.has(`${pos.x},${pos.y}`)
  )

  return {
    generateLavaSquaresMock,
    calculateHeatMock,
    getHeatColorMock,
    isValidMoveMock,
    isTargetPositionMock,
    isLavaPositionMock
  }
})

// Mock the game logic to make tests deterministic
vi.mock('../src/gameLogic', () => ({
  levels: [
    { size: 10, minLava: 1, maxLava: 5 },
    { size: 10, minLava: 5, maxLava: 15 }
  ],
  calculateHeat: gameLogicMocks.calculateHeatMock,
  generateLavaSquares: gameLogicMocks.generateLavaSquaresMock,
  isValidMove: gameLogicMocks.isValidMoveMock,
  isTargetPosition: gameLogicMocks.isTargetPositionMock,
  isLavaPosition: gameLogicMocks.isLavaPositionMock,
  getHeatColor: gameLogicMocks.getHeatColorMock
}))

const {
  generateLavaSquaresMock,
  calculateHeatMock,
  getHeatColorMock
} = gameLogicMocks

beforeEach(() => {
  vi.clearAllMocks()
  generateLavaSquaresMock.mockReset()
  calculateHeatMock.mockReset()
  getHeatColorMock.mockReset()

  generateLavaSquaresMock.mockImplementation(() => new Set(['5,5', '6,6']))
  calculateHeatMock.mockImplementation((x: number, y: number, lavaSet: LavaSquares): number => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const checkKey = `${x + dx},${y + dy}`
        if (lavaSet.has(checkKey)) return 1
      }
    }
    return 0
  })
  getHeatColorMock.mockImplementation((count: number): string =>
    count === 0 ? 'bg-gray-300' : 'bg-yellow-200'
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Heatseeker Game Component', () => {
  describe('Initial Game State', () => {
    it('should render start screen with game title', () => {
      render(<Heatseeker />)

      expect(screen.getByText('🔥 HEATSEEKER 🔥')).toBeInTheDocument()
      expect(screen.getByText('Leaderboard:')).toBeInTheDocument()
      expect(screen.getByText('Start Game')).toBeInTheDocument()
    })
  })

  describe('Game Start', () => {
    it('should start game when Start Game button is clicked', async () => {
      const user = userEvent.setup()
      render(<Heatseeker />)

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
      render(<Heatseeker />)

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
      render(<Heatseeker />)
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
      render(<Heatseeker />)

      await user.click(screen.getByText('Start Game'))

      // Look for grid container
      const gridContainer = document.querySelector('[style*="grid-template-columns"]')
      expect(gridContainer).toBeInTheDocument()

      // Should have correct number of grid cells (10x10 = 100 cells)
      const gridCells = gridContainer?.children
      expect(gridCells).toHaveLength(100)
    })

    it('should show player position with blue ring', async () => {
      const user = userEvent.setup()
      render(<Heatseeker />)

      await user.click(screen.getByText('Start Game'))

      // Player starts at bottom-left, should have blue ring
      const playerCell = document.querySelector('.ring-blue-400')
      expect(playerCell).toBeInTheDocument()
    })
  })

  describe('Move Counter', () => {
    it('should increment move counters when player moves', async () => {
      const user = userEvent.setup()
      render(<Heatseeker />)

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
      render(<Heatseeker />)

      await user.click(screen.getByText('Start Game'))

      expect(screen.getByText('Navigate safely through the lava field using heat signatures to detect danger!')).toBeInTheDocument()
    })
  })

  describe('Gameplay Outcomes', () => {
    it('should trigger game over when stepping on lava and reset on retry', async () => {
      const user = userEvent.setup()
      generateLavaSquaresMock
        .mockReturnValueOnce(new Set(['1,9']))
        .mockReturnValueOnce(new Set())

      render(<Heatseeker />)
      await user.click(screen.getByText('Start Game'))

      await user.click(screen.getByText('→'))

      await screen.findByText('💀 Game Over! 💀')
      expect(screen.getByText('Level Moves: 1')).toBeInTheDocument()
      expect(screen.getByText('Total Moves: 1')).toBeInTheDocument()
      expect(document.querySelector('.bg-black')).toBeTruthy()

      await user.click(screen.getByText('Retry Level'))

      await waitFor(() => {
        expect(screen.getByText('Level Moves: 0')).toBeInTheDocument()
        expect(screen.getByText('Total Moves: 1')).toBeInTheDocument()
      })
      expect(document.querySelector('.bg-black')).toBeFalsy()
    })

    it('should progress through levels and return to menu after winning', async () => {
      const user = userEvent.setup()
      document.body.focus()
      generateLavaSquaresMock.mockImplementation(() => new Set())

      render(<Heatseeker />)
      await user.click(screen.getByText('Start Game'))

      for (let i = 0; i < 9; i++) {
        await user.keyboard('{ArrowUp}')
      }
      for (let i = 0; i < 9; i++) {
        await user.keyboard('{ArrowRight}')
      }

      await screen.findByText('🎉 Level Complete! 🎉')
      await user.click(screen.getByText('Next Level'))
      expect(screen.getByText('Level: 2 of 2')).toBeInTheDocument()

      for (let i = 0; i < 9; i++) {
        await user.keyboard('{ArrowUp}')
      }
      for (let i = 0; i < 9; i++) {
        await user.keyboard('{ArrowRight}')
      }

      await screen.findByText('🏆 GAME COMPLETE! 🏆')
      await user.click(screen.getByText('Play Again'))

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument()
      })
    })

    it('should ignore movement that keeps the player in place', async () => {
      const user = userEvent.setup()
      render(<Heatseeker />)
      await user.click(screen.getByText('Start Game'))

      document.body.focus()
      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.getByText('Level Moves: 0')).toBeInTheDocument()
        expect(screen.getByText('Total Moves: 0')).toBeInTheDocument()
        expect(screen.queryByText('Level Moves: 1')).not.toBeInTheDocument()
      })
    })
  })
})
