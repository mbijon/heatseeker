import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeaderboardTable from '../src/components/LeaderboardTable'
import type { LeaderboardEntry } from '../src/services/leaderboardTypes'

describe('LeaderboardTable', () => {
  it('renders an error message when error is present', () => {
    render(
      <LeaderboardTable
        entries={[]}
        isLoading={false}
        error="Service unavailable"
        highlightSessionId={null}
      />
    )

    expect(screen.getByText('Leaderboard unavailable. Try again later.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows loading placeholders when loading is true', () => {
    render(
      <LeaderboardTable
        entries={[]}
        isLoading
        error={null}
        highlightSessionId={null}
      />
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByText('loading...')).toHaveLength(10)
  })

  it('renders entries, highlights the active session, and fills remaining rows', () => {
    const entries: LeaderboardEntry[] = [
      {
        sessionId: 's1',
        playerName: 'Alice',
        isHuman: true,
        levelReached: 7,
        totalMoves: 52,
        rank: 1
      },
      {
        sessionId: 's2',
        playerName: 'Beta Unit',
        isHuman: false,
        levelReached: 6,
        totalMoves: 58,
        rank: 2
      },
      {
        sessionId: 's3',
        playerName: 'Mystery',
        isHuman: null,
        levelReached: 5,
        totalMoves: 60,
        rank: 3
      }
    ]

    render(
      <LeaderboardTable
        entries={entries}
        isLoading={false}
        error={null}
        highlightSessionId="s2"
      />
    )

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Beta Unit')).toBeInTheDocument()
    expect(screen.getByText('Mystery')).toBeInTheDocument()

    const highlightedRow = screen.getByText('Beta Unit').closest('tr') as HTMLElement
    expect(highlightedRow).toHaveClass('bg-green-900/60')
    expect(highlightedRow).toHaveClass('text-green-200')

    const nonHighlightedRow = screen.getByText('Alice').closest('tr') as HTMLElement
    expect(nonHighlightedRow).not.toHaveClass('bg-green-900/60')
    expect(nonHighlightedRow).toHaveClass('text-gray-200')

    expect(screen.getByText('Human')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()

    const rowGroups = screen.getAllByRole('rowgroup')
    const body = rowGroups[1] as HTMLElement
    expect(body.querySelectorAll('tr').length).toBe(10)
    expect(body.querySelectorAll('tr.text-gray-500').length).toBe(7)
  })
})
