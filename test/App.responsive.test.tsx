import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Heatseeker from '../src/App'
import type { LavaSquares, Position } from '../src/types'

type TestUser = ReturnType<typeof userEvent.setup>

const viewportState = { width: 1024, height: 768 }

const leaderboardState = {
  isConfigured: true,
  isLoading: false,
  error: null as Error | null,
  leaderboard: [] as Array<never>,
  sessionId: 'mock-session-id',
  playerEntry: null,
  playerRank: null as number | null,
  hasSubmittedName: false,
  isHuman: null as boolean | null
}

const leaderboardMocks = {
  startNewSession: vi.fn(async () => 'mock-session-id'),
  recordProgress: vi.fn(async () => ({ entry: null, rank: null, shouldPromptName: true })),
  submitIdentity: vi.fn(async () => ({ entry: null, rank: null, shouldPromptName: false })),
  refreshLeaderboard: vi.fn(async () => { })
}

const modalControls: { latestProps: any } = { latestProps: null }

vi.mock('../src/gameLogic', () => {
  const generateLavaSquares = vi.fn((): LavaSquares => new Set())
  const calculateHeat = vi.fn(() => 0)
  const getHeatColor = vi.fn(() => 'bg-white')
  const isValidMove = vi.fn((pos: Position, direction: string, gridSize: number) => {
    let { x, y } = pos
    switch (direction) {
      case 'up': y = Math.max(0, y - 1); break
      case 'down': y = Math.min(gridSize - 1, y + 1); break
      case 'left': x = Math.max(0, x - 1); break
      case 'right': x = Math.min(gridSize - 1, x + 1); break
    }
    return { valid: x !== pos.x || y !== pos.y, newPos: { x, y } }
  })
  const isTargetPosition = vi.fn((pos: Position, gridSize: number) => pos.x === gridSize - 1 && pos.y === 0)
  const isLavaPosition = vi.fn(() => false)

  return {
    levels: [{ size: 5, minLava: 1, maxLava: 5 }],
    generateLavaSquares,
    calculateHeat,
    getHeatColor,
    isValidMove,
    isTargetPosition,
    isLavaPosition
  }
})

vi.mock('../src/hooks/useViewportSize', () => ({
  __esModule: true,
  default: vi.fn(() => ({ width: viewportState.width, height: viewportState.height }))
}))

vi.mock('../src/hooks/useLeaderboard', () => ({
  __esModule: true,
  default: () => ({
    ...leaderboardState,
    startNewSession: leaderboardMocks.startNewSession,
    recordProgress: leaderboardMocks.recordProgress,
    submitIdentity: leaderboardMocks.submitIdentity,
    refreshLeaderboard: leaderboardMocks.refreshLeaderboard
  })
}))

vi.mock('../src/components/LeaderboardModal', () => ({
  __esModule: true,
  default: (props: any) => {
    modalControls.latestProps = props
    return null
  }
}))

const reachTargetAndAwaitModal = async (user: TestUser) => {
  await waitFor(() => expect(screen.getByRole('button', { name: '↑' })).toBeInTheDocument())

  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole('button', { name: '↑' }))
  }
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole('button', { name: '→' }))
  }

  await waitFor(() => expect(modalControls.latestProps).toBeTruthy())
}

describe('Heatseeker responsive behaviors', () => {
  beforeEach(() => {
    viewportState.width = 1024
    viewportState.height = 768
    leaderboardState.isConfigured = true
    leaderboardState.leaderboard = []
    leaderboardState.playerEntry = null
    leaderboardState.playerRank = null
    leaderboardState.hasSubmittedName = false
    leaderboardState.isHuman = null

    leaderboardMocks.startNewSession.mockClear()
    leaderboardMocks.recordProgress.mockClear()
    leaderboardMocks.submitIdentity.mockClear()
    leaderboardMocks.refreshLeaderboard.mockClear()

    modalControls.latestProps = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('invokes handleNameSkip when modal skip triggered', async () => {
    const user = userEvent.setup()
    render(<Heatseeker />)

    await user.click(screen.getByRole('button', { name: /start game/i }))
    await reachTargetAndAwaitModal(user)

    await act(async () => {
      await modalControls.latestProps.onSkip()
    })

    expect(leaderboardMocks.submitIdentity).not.toHaveBeenCalled()
  })

  it('resets to start screen when bailout pressed', async () => {
    const user = userEvent.setup()
    render(<Heatseeker />)

    await user.click(screen.getByRole('button', { name: /start game/i }))
    await waitFor(() => expect(screen.getByText(/Level: 1 of 1/)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /bailout/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument())
    expect(screen.queryByText(/Level: 1 of 1/)).not.toBeInTheDocument()
  })

  it('applies width constraints on small screens', async () => {
    viewportState.width = 500
    viewportState.height = 700

    const user = userEvent.setup()
    render(<Heatseeker />)

    await user.click(screen.getByRole('button', { name: /start game/i }))
    await waitFor(() => expect(screen.getByTestId('game-grid')).toBeInTheDocument())

    const grid = screen.getByTestId('game-grid') as HTMLElement
    expect(grid.style.width).toBe('150px')
    expect(grid.style.maxWidth).toBe('468px')
  })

  it('caps grid height and enables scroll on compact mobile screens', async () => {
    viewportState.width = 360
    viewportState.height = 640

    const user = userEvent.setup()
    render(<Heatseeker />)

    await user.click(screen.getByRole('button', { name: /start game/i }))
    await waitFor(() => expect(screen.getByTestId('game-grid')).toBeInTheDocument())

    const grid = screen.getByTestId('game-grid') as HTMLElement
    expect(grid.style.maxHeight).toBe('380px')
    expect(grid.className).toContain('overflow-y-auto')
  })

  it('renders leaderboard configuration message when disabled', () => {
    leaderboardState.isConfigured = false

    render(<Heatseeker />)

    expect(screen.getByText(/Configure Supabase credentials/)).toBeInTheDocument()
  })

  it('shows final celebration rank message when player is ranked', async () => {
    leaderboardState.playerRank = 2
    leaderboardState.hasSubmittedName = true

    const user = userEvent.setup()
    render(<Heatseeker />)

    await user.click(screen.getByRole('button', { name: /start game/i }))

    await reachTargetAndAwaitModal(user)

    await waitFor(() => expect(screen.getByText(/You are currently ranked #2 on the global leaderboard./)).toBeInTheDocument())
  })

  it('submits leaderboard data through handleNameSubmit', async () => {
    const user = userEvent.setup()
    render(<Heatseeker />)

    await user.click(screen.getByRole('button', { name: /start game/i }))
    await reachTargetAndAwaitModal(user)

    await act(async () => {
      await modalControls.latestProps.onSubmit({ name: ' Tester ', isHuman: true })
    })

    expect(leaderboardMocks.submitIdentity).toHaveBeenCalledTimes(1)
    expect(leaderboardMocks.submitIdentity).toHaveBeenCalledWith({ playerName: 'Tester', isHuman: true })
  })
})
