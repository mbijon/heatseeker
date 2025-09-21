import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeaderboardModal from '../src/components/LeaderboardModal'

describe('LeaderboardModal', () => {
  it('returns null when modal is closed', () => {
    render(
      <LeaderboardModal
        isOpen={false}
        isSaving={false}
        defaultName=""
        defaultIsHuman={false}
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    )

    expect(screen.queryByText("Congratulations, you've made the Top 10!")).toBeNull()
  })

  it('submits current form values when save is clicked', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        defaultName="Agent"
        defaultIsHuman={false}
        onSubmit={handleSubmit}
        onSkip={vi.fn()}
      />
    )

    const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
    await user.clear(nameInput)
    await user.type(nameInput, 'Nova')

    const humanCheckbox = screen.getByLabelText('Are you human?')
    await user.click(humanCheckbox)

    const saveButton = screen.getByRole('button', { name: 'Save' })
    await user.click(saveButton)

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit).toHaveBeenCalledWith({ name: 'Nova', isHuman: true })
  })

  it('disables save button when the trimmed name is empty', async () => {
    const user = userEvent.setup()

    render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        defaultName=""
        defaultIsHuman={false}
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    )

    const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
    const saveButton = screen.getByRole('button', { name: 'Save' })

    expect(saveButton).toBeDisabled()

    await user.type(nameInput, '   ')
    expect(saveButton).toBeDisabled()

    await user.clear(nameInput)
    await user.type(nameInput, 'Explorer')
    expect(saveButton).toBeEnabled()
  })

  it('shows saving state and disables actions when saving', () => {
    render(
      <LeaderboardModal
        isOpen
        isSaving
        defaultName="Ranger"
        defaultIsHuman={true}
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    )

    const savingButton = screen.getByRole('button', { name: /Saving/ })
    const skipButton = screen.getByRole('button', { name: 'Skip' })

    expect(savingButton).toBeDisabled()
    expect(skipButton).toBeDisabled()
  })

  it('resets name and human state when reopened with new defaults', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    const handleSkip = vi.fn()

    const { rerender } = render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        defaultName="Alpha"
        defaultIsHuman={false}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    )

    const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
    await user.clear(nameInput)
    await user.type(nameInput, 'Beta')

    const humanCheckbox = screen.getByLabelText('Are you human?')
    await user.click(humanCheckbox)

    rerender(
      <LeaderboardModal
        isOpen={false}
        isSaving={false}
        defaultName="Alpha"
        defaultIsHuman={false}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    )

    expect(screen.queryByLabelText('Display Name (max 16 characters)')).toBeNull()

    rerender(
      <LeaderboardModal
        isOpen
        isSaving={false}
        defaultName="Gamma"
        defaultIsHuman={true}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    )

    const reopenedNameInput = screen.getByLabelText('Display Name (max 16 characters)')
    await waitFor(() => expect(reopenedNameInput).toHaveValue('Gamma'))
    await waitFor(() => expect(screen.getByLabelText('Are you human?')).toBeChecked())
  })

  it('invokes onSkip when skip button is clicked', async () => {
    const user = userEvent.setup()
    const handleSkip = vi.fn()

    render(
      <LeaderboardModal
        isOpen
        isSaving={false}
        defaultName="Scout"
        defaultIsHuman={false}
        onSubmit={vi.fn()}
        onSkip={handleSkip}
      />
    )

    const skipButton = screen.getByRole('button', { name: 'Skip' })
    await user.click(skipButton)

    expect(handleSkip).toHaveBeenCalledTimes(1)
  })
})
