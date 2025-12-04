import { useEffect, useState, type FormEvent } from 'react';

interface LeaderboardModalProps {
  isOpen: boolean;
  isSaving: boolean;
  defaultName?: string;
  defaultIsHuman?: boolean;
  onSubmit: (payload: { name: string; isHuman: boolean }) => Promise<void> | void;
  onSkip: () => void;
}

/**
 * Sanitize player name input to only allow safe characters
 * Allowed: alphanumeric (a-z, A-Z, 0-9), underscores, spaces, and hyphens
 * @param input Raw input string
 * @returns Sanitized string with only allowed characters
 */
const sanitizeName = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9_\s-]/g, '');
};

const LeaderboardModal = ({
  isOpen,
  isSaving,
  defaultName = '',
  defaultIsHuman = false,
  onSubmit,
  onSkip
}: LeaderboardModalProps) => {
  const [name, setName] = useState(defaultName);
  const [isHuman, setIsHuman] = useState(defaultIsHuman);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setIsHuman(defaultIsHuman);
    }
  }, [isOpen, defaultName, defaultIsHuman]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Trim whitespace from sanitized name before submitting
    await onSubmit({ name: name.trim(), isHuman });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-purple-400 bg-gray-900 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-purple-200">Congratulations, you've made the Top 10!</h2>
        <p className="mt-2 text-sm text-gray-300">
          Add your name to the console or skip to keep playing.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="leaderboard-name" className="block text-sm font-semibold text-gray-200">
              Display Name (max 16 characters)
            </label>
            <input
              id="leaderboard-name"
              type="text"
              value={name}
              maxLength={16}
              onChange={event => setName(sanitizeName(event.target.value))}
              className="mt-1 w-full rounded bg-gray-800 px-3 py-2 text-gray-100 outline-none ring-1 ring-gray-700 focus:ring-2 focus:ring-purple-400"
              placeholder="Player"
            />
          </div>

          <div className="mt-5 flex justify-center">
            <label className="inline-flex items-center space-x-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={isHuman}
                onChange={event => setIsHuman(event.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-purple-400 focus:ring-purple-500"
              />
              <span>Are you human?</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onSkip}
              className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-600"
              disabled={isSaving}
            >
              Skip
            </button>
            <button
              type="submit"
              className="rounded bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-60"
              disabled={isSaving || name.trim().length === 0}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaderboardModal;
