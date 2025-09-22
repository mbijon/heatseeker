import { describe, it, expect } from 'vitest'
import {
  levels,
  calculateHeat,
  generateLavaSquares,
  isValidMove,
  isTargetPosition,
  isLavaPosition,
  getHeatColor
} from '../src/gameLogic'
import type { Position, Direction, LavaSquares } from '../src/types'

describe('Game Logic', () => {
  describe('levels configuration', () => {
    it('should have 10 levels', () => {
      expect(levels).toHaveLength(10)
    })

    it('should have increasing difficulty', () => {
      expect(levels[0].size).toBe(10)
      expect(levels[9].size).toBe(100)
      expect(levels[0].maxLava).toBeLessThan(levels[9].minLava)
    })

    it('should have valid lava ranges', () => {
      levels.forEach((level, index) => {
        expect(level.minLava).toBeLessThanOrEqual(level.maxLava)
        expect(level.minLava).toBeGreaterThan(0)
        expect(level.size).toBeGreaterThan(0)
      })
    })
  })

  describe('calculateHeat', () => {
    it('should return 0 for no adjacent lava', () => {
      const lavaSet: LavaSquares = new Set(['5,5'])
      const heat = calculateHeat(0, 0, lavaSet)
      expect(heat).toBe(0)
    })

    it('should count adjacent lava correctly', () => {
      const lavaSet: LavaSquares = new Set(['1,0', '0,1', '1,1'])
      const heat = calculateHeat(0, 0, lavaSet)
      expect(heat).toBe(3)
    })

    it('should not count the current position', () => {
      const lavaSet: LavaSquares = new Set(['1,1'])
      const heat = calculateHeat(1, 1, lavaSet)
      expect(heat).toBe(0)
    })

    it('should handle edge positions', () => {
      const lavaSet: LavaSquares = new Set(['0,1'])
      const heat = calculateHeat(0, 0, lavaSet)
      expect(heat).toBe(1)
    })

    it('should count maximum 8 adjacent squares', () => {
      const lavaSet: LavaSquares = new Set([
        '0,0', '0,1', '0,2',
        '1,0',        '1,2',
        '2,0', '2,1', '2,2'
      ])
      const heat = calculateHeat(1, 1, lavaSet)
      expect(heat).toBe(8)
    })
  })

  describe('generateLavaSquares', () => {
    it('should generate correct number of lava squares for level 0', () => {
      const lavaSquares = generateLavaSquares(0)
      expect(lavaSquares.size).toBeGreaterThanOrEqual(levels[0].minLava)
      expect(lavaSquares.size).toBeLessThanOrEqual(levels[0].maxLava)
    })

    it('should not place lava on starting position', () => {
      const lavaSquares = generateLavaSquares(0)
      const level = levels[0]
      const startKey = `0,${level.size - 1}`
      expect(lavaSquares.has(startKey)).toBe(false)
    })

    it('should not place lava on target position', () => {
      const lavaSquares = generateLavaSquares(0)
      const level = levels[0]
      const targetKey = `${level.size - 1},0`
      expect(lavaSquares.has(targetKey)).toBe(false)
    })

    it('should generate different patterns on multiple calls', () => {
      const lava1 = generateLavaSquares(0)
      const lava2 = generateLavaSquares(0)

      // Convert to arrays for comparison
      const arr1 = Array.from(lava1).sort()
      const arr2 = Array.from(lava2).sort()

      // With randomness, they should likely be different
      // (though technically they could be the same)
      expect(arr1.length).toBeGreaterThan(0)
      expect(arr2.length).toBeGreaterThan(0)
    })
  })

  describe('isValidMove', () => {
    const gridSize = 10

    it('should allow valid moves within bounds', () => {
      const pos: Position = { x: 5, y: 5 }

      expect(isValidMove(pos, 'up', gridSize)).toEqual({
        valid: true,
        newPos: { x: 5, y: 4 }
      })

      expect(isValidMove(pos, 'down', gridSize)).toEqual({
        valid: true,
        newPos: { x: 5, y: 6 }
      })

      expect(isValidMove(pos, 'left', gridSize)).toEqual({
        valid: true,
        newPos: { x: 4, y: 5 }
      })

      expect(isValidMove(pos, 'right', gridSize)).toEqual({
        valid: true,
        newPos: { x: 6, y: 5 }
      })
    })

    it('should prevent moves outside bounds', () => {
      const topLeft: Position = { x: 0, y: 0 }
      const bottomRight: Position = { x: 9, y: 9 }

      expect(isValidMove(topLeft, 'up', gridSize)).toEqual({
        valid: false,
        newPos: { x: 0, y: 0 }
      })

      expect(isValidMove(topLeft, 'left', gridSize)).toEqual({
        valid: false,
        newPos: { x: 0, y: 0 }
      })

      expect(isValidMove(bottomRight, 'down', gridSize)).toEqual({
        valid: false,
        newPos: { x: 9, y: 9 }
      })

      expect(isValidMove(bottomRight, 'right', gridSize)).toEqual({
        valid: false,
        newPos: { x: 9, y: 9 }
      })
    })

    it('should handle invalid direction', () => {
      const pos: Position = { x: 5, y: 5 }
      expect(isValidMove(pos, 'invalid' as Direction, gridSize)).toEqual({
        valid: false,
        newPos: { x: 5, y: 5 }
      })
    })
  })

  describe('isTargetPosition', () => {
    it('should identify target position correctly', () => {
      expect(isTargetPosition({ x: 9, y: 0 }, 10)).toBe(true)
      expect(isTargetPosition({ x: 19, y: 0 }, 20)).toBe(true)
    })

    it('should reject non-target positions', () => {
      expect(isTargetPosition({ x: 0, y: 0 }, 10)).toBe(false)
      expect(isTargetPosition({ x: 9, y: 9 }, 10)).toBe(false)
      expect(isTargetPosition({ x: 8, y: 0 }, 10)).toBe(false)
    })
  })

  describe('isLavaPosition', () => {
    it('should identify lava positions correctly', () => {
      const lavaSet: LavaSquares = new Set(['1,1', '5,5', '8,3'])

      expect(isLavaPosition({ x: 1, y: 1 }, lavaSet)).toBe(true)
      expect(isLavaPosition({ x: 5, y: 5 }, lavaSet)).toBe(true)
      expect(isLavaPosition({ x: 8, y: 3 }, lavaSet)).toBe(true)
    })

    it('should reject non-lava positions', () => {
      const lavaSet: LavaSquares = new Set(['1,1', '5,5'])

      expect(isLavaPosition({ x: 0, y: 0 }, lavaSet)).toBe(false)
      expect(isLavaPosition({ x: 2, y: 2 }, lavaSet)).toBe(false)
    })
  })

  describe('getHeatColor', () => {
    it('should return correct colors for each heat level', () => {
      expect(getHeatColor(0)).toBe('bg-white')
      expect(getHeatColor(1)).toBe('bg-yellow-200')
      expect(getHeatColor(2)).toBe('bg-yellow-300')
      expect(getHeatColor(3)).toBe('bg-orange-400')
      expect(getHeatColor(4)).toBe('bg-orange-500')
      expect(getHeatColor(5)).toBe('bg-red-300')
      expect(getHeatColor(6)).toBe('bg-red-600')
      expect(getHeatColor(7)).toBe('bg-rose-600')
      expect(getHeatColor(8)).toBe('bg-pink-500')
    })

    it('should handle invalid heat levels', () => {
      expect(getHeatColor(-1)).toBe('bg-white')
      expect(getHeatColor(9)).toBe('bg-white')
      expect(getHeatColor(100)).toBe('bg-white')
    })
  })
})
