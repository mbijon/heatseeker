import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import useLeaderboard from '../src/hooks/useLeaderboard'
import type { LeaderboardEntry } from '../src/services/leaderboardTypes'
import type { UpdateScoreResult } from '../src/services/leaderboard'
import {
  fetchLeaderboard,
  startSession,
  updateScore
} from '../src/services/leaderboard'

type UpdateScoreArgs = Parameters<typeof updateScore>[0]

declare module '../src/services/leaderboard' {
  // expose helper to tweak configuration in tests if ever needed
  export const isLeaderboardConfigured: boolean
}

vi.mock('../src/services/leaderboard', () => {
  const fetchLeaderboardMock = vi.fn<[], Promise<LeaderboardEntry[]>>()
  const startSessionMock = vi.fn<[], Promise<string | null>>()
  const updateScoreMock = vi.fn<
    [UpdateScoreArgs],
    Promise<UpdateScoreResult | null>
  >()

  return {
    __esModule: true,
    fetchLeaderboard: fetchLeaderboardMock,
    startSession: startSessionMock,
    updateScore: updateScoreMock,
    isLeaderboardConfigured: true
  }
})

describe('useLeaderboard hook', () => {
  const fetchLeaderboardMock = vi.mocked(fetchLeaderboard)
  const startSessionMock = vi.mocked(startSession)
  const updateScoreMock = vi.mocked(updateScore)

  const sampleEntry = (override: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
    sessionId: 'session-alpha',
    playerName: 'Runner',
    isHuman: true,
    levelReached: 4,
    totalMoves: 80,
    rank: 1,
    ...override
  })

  beforeEach(() => {
    fetchLeaderboardMock.mockReset()
    startSessionMock.mockReset()
    updateScoreMock.mockReset()
  })

  it('loads leaderboard data on mount and refreshes', async () => {
    fetchLeaderboardMock
      .mockResolvedValueOnce([sampleEntry({ sessionId: 'one', playerName: 'Alice', rank: 1 })])
      .mockResolvedValueOnce([sampleEntry({ sessionId: 'two', playerName: 'Bob', rank: 1 })])

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(result.current.leaderboard).toHaveLength(1)
    })
    expect(result.current.leaderboard[0]?.playerName).toBe('Alice')

    await act(async () => {
      await result.current.refreshLeaderboard()
    })

    await waitFor(() => {
      expect(result.current.leaderboard[0]?.playerName).toBe('Bob')
    })
    expect(fetchLeaderboardMock).toHaveBeenCalledTimes(2)
  })

  it('sets error state when initial leaderboard fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchLeaderboardMock.mockRejectedValueOnce(new Error('network boom'))

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(result.current.error).toBe('Unable to load leaderboard')
      expect(result.current.isLoading).toBe(false)
    })

    consoleSpy.mockRestore()
  })

  it('starts a new session and resets local flags', async () => {
    fetchLeaderboardMock.mockResolvedValueOnce([])
    startSessionMock.mockResolvedValueOnce('session-new')

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(fetchLeaderboardMock).toHaveBeenCalled()
    })

    await act(async () => {
      const id = await result.current.startNewSession()
      expect(id).toBe('session-new')
    })

    expect(result.current.sessionId).toBe('session-new')
    expect(result.current.hasSubmittedName).toBe(false)
    expect(result.current.isHuman).toBeNull()
  })

  it('handles start session errors gracefully', async () => {
    fetchLeaderboardMock.mockResolvedValueOnce([])
    startSessionMock.mockRejectedValueOnce(new Error('no session'))

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(fetchLeaderboardMock).toHaveBeenCalled()
    })

    await act(async () => {
      const id = await result.current.startNewSession()
      expect(id).toBeNull()
    })

    expect(result.current.error).toBe('Unable to start leaderboard session')
    expect(result.current.sessionId).toBeNull()
  })

  it('records progress and prompts for name when entering top 10 without one', async () => {
    fetchLeaderboardMock.mockResolvedValueOnce([])
    startSessionMock.mockResolvedValueOnce('session-top')
    updateScoreMock.mockResolvedValueOnce({
      leaderboard: [],
      sessionEntry: null
    })

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(fetchLeaderboardMock).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.startNewSession()
    })

    let response: Awaited<ReturnType<typeof result.current.recordProgress>> | null = null
    await act(async () => {
      response = await result.current.recordProgress({
        levelReached: 5,
        totalMoves: 90
      })
    })

    expect(updateScoreMock).toHaveBeenCalledWith({
      sessionId: 'session-top',
      levelReached: 5,
      totalMoves: 90,
      playerName: undefined,
      isHuman: undefined
    })
    expect(response?.rank).toBe(1)
    expect(response?.shouldPromptName).toBe(true)
    expect(result.current.hasSubmittedName).toBe(false)
  })

  it('does not prompt when score is outside top 10', async () => {
    const seededEntries = Array.from({ length: 10 }).map((_, idx) =>
      sampleEntry({
        sessionId: `seed-${idx}`,
        playerName: `Player ${idx}`,
        levelReached: 15 - idx,
        totalMoves: 40 + idx,
        rank: idx + 1
      })
    )

    fetchLeaderboardMock.mockResolvedValueOnce(seededEntries)
    startSessionMock.mockResolvedValueOnce('session-outside')
    updateScoreMock.mockResolvedValueOnce({ leaderboard: [], sessionEntry: null })

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(result.current.leaderboard).toHaveLength(10)
    })

    await act(async () => {
      await result.current.startNewSession()
    })

    let outcome: Awaited<ReturnType<typeof result.current.recordProgress>> | null = null
    await act(async () => {
      outcome = await result.current.recordProgress({ levelReached: 1, totalMoves: 200 })
    })

    expect(outcome?.shouldPromptName).toBe(false)
    expect(outcome?.rank).toBeGreaterThan(10)
  })

  it('submits identity and updates state', async () => {
    fetchLeaderboardMock.mockResolvedValueOnce([])
    startSessionMock.mockResolvedValueOnce('session-id')
    updateScoreMock
      .mockResolvedValueOnce({
        leaderboard: [],
        sessionEntry: null
      })
      .mockResolvedValueOnce({
        leaderboard: [
          sampleEntry({
            sessionId: 'session-id',
            playerName: 'Hero',
            isHuman: true,
            levelReached: 6,
            totalMoves: 88,
            rank: 1
          })
        ],
        sessionEntry: sampleEntry({
          sessionId: 'session-id',
          playerName: 'Hero',
          isHuman: true,
          levelReached: 6,
          totalMoves: 88,
          rank: 1
        })
      })

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(fetchLeaderboardMock).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.startNewSession()
    })

    await act(async () => {
      await result.current.recordProgress({ levelReached: 6, totalMoves: 88 })
    })

    let submission
    await act(async () => {
      submission = await result.current.submitIdentity({ playerName: 'Hero', isHuman: true })
    })

    expect(submission?.rank).toBe(1)
    expect(result.current.hasSubmittedName).toBe(true)
    expect(result.current.isHuman).toBe(true)
    expect(updateScoreMock).toHaveBeenCalledTimes(2)
  })

  it('skip submitIdentity when no progress recorded', async () => {
    fetchLeaderboardMock.mockResolvedValueOnce([])
    startSessionMock.mockResolvedValueOnce('session-empty')

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(fetchLeaderboardMock).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.startNewSession()
    })

    let submission: Awaited<ReturnType<typeof result.current.submitIdentity>> | null = null
    await act(async () => {
      submission = await result.current.submitIdentity({ playerName: 'Name', isHuman: true })
    })

    expect(submission).toBeNull()
    expect(updateScoreMock).toHaveBeenCalledTimes(0)
  })

  it('leaves leaderboard unchanged when refresh fails', async () => {
    const initialEntries = [sampleEntry({ sessionId: 'seed-1', playerName: 'Seed', rank: 1 })]
    fetchLeaderboardMock
      .mockResolvedValueOnce(initialEntries)
      .mockRejectedValueOnce(new Error('refresh fail'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useLeaderboard())

    await waitFor(() => {
      expect(result.current.leaderboard[0]?.playerName).toBe('Seed')
    })

    await act(async () => {
      await result.current.refreshLeaderboard()
    })

    expect(result.current.leaderboard[0]?.playerName).toBe('Seed')
    expect(fetchLeaderboardMock).toHaveBeenCalledTimes(2)

    consoleSpy.mockRestore()
  })
})
