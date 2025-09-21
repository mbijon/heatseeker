import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LeaderboardModal from '../src/components/LeaderboardModal'

describe('LeaderboardModal', () => {
  const onSubmit = vi.fn()
  const onSkip = vi.fn()

  beforeEach(() => {
    onSubmit.mockReset()
    onSkip.mockReset()
  })

  it('should not render when closed', () => {
    const { container } = render(
      <LeaderboardModal
        isOpen={false}
        isSaving={false}
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders with default values and allows name entry', () => {
    render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    )

    const nameInput = screen.getByLabelText(/display name/i) as HTMLInputElement
    expect(nameInput.value).toBe('')

    fireEvent.change(nameInput, { target: { value: 'Hot Runner' } })
    expect(nameInput.value).toBe('Hot Runner')
  })

  it('calls onSkip when skip button is clicked', () => {
    render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    )

    const skipButton = screen.getByRole('button', { name: /^skip$/i })
    fireEvent.click(skipButton)
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('invokes submit handler with trimmed name and checkbox', async () => {
    render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        onSubmit={onSubmit}
        onSkip={onSkip}
        defaultName=" Runner "
        defaultIsHuman
      />
    )

    expect((screen.getByLabelText(/display name/i) as HTMLInputElement).value).toBe(' Runner ')

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: ' Lava Champ ' } })
    const checkbox = screen.getByText(/are you human/i).previousSibling as HTMLInputElement
    expect(checkbox).toBeTruthy()
    expect(checkbox).toBeChecked()

    await fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({ name: ' Lava Champ ', isHuman: true })
  })

  it('disables save button while saving or empty name', () => {
    const { rerender } = render(
      <LeaderboardModal
        isOpen
        isSaving
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    )

    const savingButton = screen.getByRole('button', { name: /saving/i })
    expect(savingButton).toBeDisabled()

    rerender(
      <LeaderboardModal
        isOpen
        isSaving={false}
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    )

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'R' } })
    expect(saveButton).not.toBeDisabled()
  })
})
