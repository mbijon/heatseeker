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

  describe('Input Sanitization', () => {
    it('allows safe alphanumeric characters without modification', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, 'Player123')

      expect(nameInput).toHaveValue('Player123')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Player123', isHuman: false })
    })

    it('allows underscores, spaces, and hyphens', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, 'Cool_Gamer-42')

      expect(nameInput).toHaveValue('Cool_Gamer-42')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Cool_Gamer-42', isHuman: false })
    })

    it('removes XSS script tags and malicious characters', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, "<script>alert('XSS')</script>")

      // Should strip out <, >, (, ), ', and leave only alphanumeric
      // Note: Result is truncated to 16 chars due to maxLength
      expect(nameInput).toHaveValue('scriptalertXSSsc')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'scriptalertXSSsc', isHuman: false })
    })

    it('removes SQL injection characters', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, "'; DROP TABLE--")

      // Should strip out ' and ; but keep space, hyphen, and alphanumeric
      expect(nameInput).toHaveValue(' DROP TABLE--')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      // Trimmed on submission
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'DROP TABLE--', isHuman: false })
    })

    it('removes special characters like @#$%', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, 'Player@#$%Name')

      expect(nameInput).toHaveValue('PlayerName')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'PlayerName', isHuman: false })
    })

    it('removes accented characters', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, 'José García')

      // Accents removed, space preserved
      expect(nameInput).toHaveValue('Jos Garca')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Jos Garca', isHuman: false })
    })

    it('removes exclamation marks and other punctuation', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, 'Player!!!')

      expect(nameInput).toHaveValue('Player')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Player', isHuman: false })
    })

    it('sanitizes input in real-time as user types', async () => {
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

      // Type character by character and verify real-time sanitization
      await user.type(nameInput, 'Test')
      expect(nameInput).toHaveValue('Test')

      await user.type(nameInput, '@')
      expect(nameInput).toHaveValue('Test') // @ should be stripped

      await user.type(nameInput, 'User')
      expect(nameInput).toHaveValue('TestUser')

      await user.type(nameInput, '!!!')
      expect(nameInput).toHaveValue('TestUser') // !!! should be stripped
    })

    it('trims whitespace from final submission', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <LeaderboardModal
          isOpen
          isSaving={false}
          defaultName=""
          defaultIsHuman={false}
          onSubmit={handleSubmit}
          onSkip={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText('Display Name (max 16 characters)')
      await user.type(nameInput, '  SpacedName  ')

      // Input shows with spaces
      expect(nameInput).toHaveValue('  SpacedName  ')

      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)

      // Submitted with spaces trimmed
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'SpacedName', isHuman: false })
    })
  })
})
