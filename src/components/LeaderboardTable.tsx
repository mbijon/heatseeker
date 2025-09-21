import type { LeaderboardEntry } from '../services/leaderboardTypes';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  error?: string | null;
  highlightSessionId?: string | null;
}

const tableBaseClasses = 'w-full text-left text-sm text-gray-200';
const headerClasses = 'px-4 py-3 text-sm uppercase tracking-wide text-gray-300 border-b border-gray-700';
const cellClasses = 'py-2 border-b border-gray-800 text-sm';

const LeaderboardTable = ({
  entries,
  isLoading = false,
  error,
  highlightSessionId
}: LeaderboardTableProps) => {
  if (error) {
    return (
      <div className="rounded-lg border border-red-500 bg-red-900/30 p-4 text-sm text-red-200">
        Leaderboard unavailable. Try again later.
      </div>
    );
  }

  if (!isLoading && entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-4 text-sm text-gray-400">
        No ranked runs yet. Be the first to chart a path through the lava field!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900/70">
      <table className={`${tableBaseClasses} font-mono`}>
        <thead className="bg-gray-900/50">
          <tr>
            <th className={`${headerClasses} pl-6`}>#</th>
            <th className={headerClasses}>Name</th>
            <th className={headerClasses}>Type</th>
            <th className={headerClasses}>Level</th>
            <th className={headerClasses}>Moves</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 10 }).map((_, idx) => (
                <tr key={`placeholder-${idx}`} className="animate-pulse">
                  <td className={`${cellClasses} text-gray-600`}>--</td>
                  <td className={`${cellClasses} text-gray-600`}>loading...</td>
                  <td className={`${cellClasses} text-gray-600`}>--</td>
                  <td className={`${cellClasses} text-gray-600`}>--</td>
                  <td className={`${cellClasses} text-gray-600`}>--</td>
                </tr>
              ))
            : entries.map(entry => {
                const isHighlighted = highlightSessionId === entry.sessionId;
                const typeLabel = entry.isHuman == null ? 'Unknown' : entry.isHuman ? 'Human' : 'AI';
                return (
                  <tr
                    key={entry.sessionId}
                    className={
                      isHighlighted
                        ? 'bg-green-900/60 text-green-200'
                        : 'text-gray-200'
                    }
                  >
                    <td className={`${cellClasses} pl-6 pr-4`}>#{entry.rank}</td>
                    <td className={`${cellClasses} pr-4`}>{entry.playerName}</td>
                    <td className={`${cellClasses} pr-4`}>{typeLabel}</td>
                    <td className={`${cellClasses} pr-4`}>{entry.levelReached}</td>
                    <td className={cellClasses}>{entry.totalMoves}</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
