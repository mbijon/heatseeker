import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchLeaderboard,
  isLeaderboardConfigured,
  startSession,
  updateScore,
  type UpdateScoreResult
} from '../services/leaderboard';
import type { LeaderboardEntry, LeaderboardRecordResult } from '../services/leaderboardTypes';

interface RecordProgressArgs {
  levelReached: number;
  totalMoves: number;
  playerName?: string | null;
  isHuman?: boolean | null;
}

interface UseLeaderboardResult {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  leaderboard: LeaderboardEntry[];
  sessionId: string | null;
  playerEntry: LeaderboardEntry | null;
  playerRank: number | null;
  hasSubmittedName: boolean;
  isHuman: boolean | null;
  startNewSession: () => Promise<string | null>;
  recordProgress: (args: RecordProgressArgs) => Promise<LeaderboardRecordResult | null>;
  submitIdentity: (args: { playerName: string; isHuman: boolean }) => Promise<LeaderboardRecordResult | null>;
  refreshLeaderboard: () => Promise<void>;
}

const mapSessionEntry = (
  sessionId: string | null,
  result: UpdateScoreResult | null,
  fallbackEntries: LeaderboardEntry[]
): { entry: LeaderboardEntry | null; rank: number | null } => {
  if (!sessionId || !result) {
    return { entry: null, rank: null };
  }

  if (result.sessionEntry) {
    const rank = result.sessionEntry.rank && result.sessionEntry.rank > 0
      ? result.sessionEntry.rank
      : fallbackEntries.find(entry => entry.sessionId === sessionId)?.rank ?? null;
    return {
      entry: rank ? { ...result.sessionEntry, rank } : result.sessionEntry,
      rank
    };
  }

  const entry = fallbackEntries.find(item => item.sessionId === sessionId) ?? null;
  const rank = entry?.rank && entry.rank > 0 ? entry.rank : null;
  return {
    entry: entry && rank ? { ...entry, rank } : entry,
    rank
  };
};

export const useLeaderboard = (): UseLeaderboardResult => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [isHuman, setIsHuman] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const lastReportedRef = useRef<{ levelReached: number; totalMoves: number } | null>(null);

  const applyLeaderboard = useCallback((entries: LeaderboardEntry[]) => {
    const visibleEntries = entries.filter(entry => entry.playerName);
    setLeaderboard(visibleEntries.map((entry, idx) => ({ ...entry, rank: idx + 1 })));
  }, []);

  const loadInitialLeaderboard = useCallback(async () => {
    if (!isLeaderboardConfigured) return;
    setIsLoading(true);
    try {
      const entries = await fetchLeaderboard();
      applyLeaderboard(entries);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [applyLeaderboard]);

  useEffect(() => {
    void loadInitialLeaderboard();
  }, [loadInitialLeaderboard]);

  const startNewSession = useCallback(async () => {
    if (!isLeaderboardConfigured) return null;
    try {
      const id = await startSession(navigator.userAgent);
      if (id) {
        setSessionId(id);
        setHasSubmittedName(false);
        setIsHuman(null);
        lastReportedRef.current = null;
      }
      return id;
    } catch (err) {
      console.error(err);
      setError('Unable to start leaderboard session');
      return null;
    }
  }, []);

  const recordProgress = useCallback(
    async ({ levelReached, totalMoves, playerName, isHuman: isHumanFlag }: RecordProgressArgs) => {
      if (!sessionId) return null;

      const result = await updateScore({
        sessionId,
        levelReached,
        totalMoves,
        playerName,
        isHuman: isHumanFlag
      });

      if (!result) return null;

      applyLeaderboard(result.leaderboard);

      const { entry, rank } = mapSessionEntry(sessionId, result, result.leaderboard);

      if (typeof isHumanFlag === 'boolean') {
        setIsHuman(isHumanFlag);
      }

      if (playerName) {
        setHasSubmittedName(true);
      } else if (entry?.playerName) {
        setHasSubmittedName(true);
      }

      lastReportedRef.current = { levelReached, totalMoves };

      const resolvedRank = rank && rank > 0 ? rank : null;

      return {
        entry,
        rank: resolvedRank,
        shouldPromptName: resolvedRank !== null && !(entry?.playerName)
      } satisfies LeaderboardRecordResult;
    },
    [applyLeaderboard, sessionId]
  );

  const submitIdentity = useCallback(
    async ({ playerName, isHuman: isHumanFlag }: { playerName: string; isHuman: boolean }) => {
      if (!sessionId || !lastReportedRef.current) return null;

      const { levelReached, totalMoves } = lastReportedRef.current;
      const outcome = await recordProgress({
        levelReached,
        totalMoves,
        playerName,
        isHuman: isHumanFlag
      });

      if (outcome) {
        setHasSubmittedName(Boolean(playerName));
        setIsHuman(isHumanFlag);
      }

      return outcome;
    },
    [recordProgress, sessionId]
  );

  const playerEntry = useMemo(() => {
    if (!sessionId) return null;
    return leaderboard.find(entry => entry.sessionId === sessionId) ?? null;
  }, [leaderboard, sessionId]);

  const playerRank = playerEntry?.rank ?? null;

  const refreshLeaderboard = useCallback(async () => {
    if (!isLeaderboardConfigured) return;
    try {
      const entries = await fetchLeaderboard();
      applyLeaderboard(entries);
    } catch (err) {
      console.error('Failed to refresh leaderboard', err);
    }
  }, [applyLeaderboard]);

  useEffect(() => {
    if (playerEntry?.playerName) {
      setHasSubmittedName(true);
    }
    if (typeof playerEntry?.isHuman === 'boolean') {
      setIsHuman(playerEntry.isHuman);
    }
  }, [playerEntry]);

  return {
    isConfigured: isLeaderboardConfigured,
    isLoading,
    error,
    leaderboard,
    sessionId,
    playerEntry,
    playerRank,
    hasSubmittedName,
    isHuman,
    startNewSession,
    recordProgress,
    submitIdentity,
    refreshLeaderboard
  };
};

export default useLeaderboard;
