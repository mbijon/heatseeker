import type { LeaderboardEntry } from './leaderboardTypes';

export interface LeaderboardApiEntry {
  session_id: string;
  player_name: string | null;
  is_human: boolean | null;
  level_reached: number;
  total_moves: number;
}

interface StartSessionResponse {
  sessionId: string;
}

interface UpdateScoreResponse {
  leaderboard: LeaderboardApiEntry[];
  session?: LeaderboardApiEntry | null;
}

const SUPABASE_URL =
  import.meta.env.PUBLIC_HEATSEEKER_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;

const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_HEATSEEKER_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY;

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json'
};

const AUTH_HEADERS: HeadersInit = SUPABASE_ANON_KEY
  ? {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  : {};

export const isLeaderboardConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const buildFunctionUrl = (functionName: string): string | null => {
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
};

async function callSupabaseFunction<T>(
  functionName: string,
  payload?: unknown,
  init?: RequestInit
): Promise<T> {
  const url = buildFunctionUrl(functionName);
  if (!url || !isLeaderboardConfigured) {
    throw new Error('Supabase environment variables are not configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...AUTH_HEADERS,
      ...(init?.headers ?? {})
    },
    body: payload ? JSON.stringify(payload) : undefined
  });

  if (!response.ok) {
    const errorMessage = await response.text().catch(() => 'Unknown error');
    throw new Error(`Supabase function ${functionName} failed: ${errorMessage}`);
  }

  return response.json() as Promise<T>;
}

const normalizeEntry = (entry: LeaderboardApiEntry, index: number): LeaderboardEntry => ({
  sessionId: entry.session_id,
  playerName: entry.player_name ?? '',
  isHuman: entry.is_human,
  levelReached: entry.level_reached,
  totalMoves: entry.total_moves,
  rank: index >= 0 ? index + 1 : 0
});

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isLeaderboardConfigured) return [];

  try {
    const entries = await callSupabaseFunction<LeaderboardApiEntry[]>(
      'leaderboard',
      undefined,
      { method: 'GET' }
    );
    const sorted = entries.map((entry, idx) => normalizeEntry(entry, idx));
    return sorted.filter(entry => entry.playerName);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
}

export async function startSession(userAgent: string): Promise<string | null> {
  if (!isLeaderboardConfigured) return null;

  try {
    const response = await callSupabaseFunction<StartSessionResponse>('start-session', {
      userAgent
    });
    return response.sessionId;
  } catch (error) {
    console.error('Failed to start leaderboard session:', error);
    return null;
  }
}

interface UpdateScorePayload {
  sessionId: string;
  levelReached: number;
  totalMoves: number;
  playerName?: string | null;
  isHuman?: boolean | null;
}

export interface UpdateScoreResult {
  leaderboard: LeaderboardEntry[];
  sessionEntry: LeaderboardEntry | null;
}

export async function updateScore(payload: UpdateScorePayload): Promise<UpdateScoreResult | null> {
  if (!isLeaderboardConfigured) {
    return {
      leaderboard: [],
      sessionEntry: null
    };
  }

  try {
    const response = await callSupabaseFunction<UpdateScoreResponse>('update-score', payload);
    const rawEntries = response.leaderboard ?? [];
    const normalized = rawEntries.map((entry, idx) => normalizeEntry(entry, idx));
    const sessionIndex = rawEntries.findIndex(entry => entry.session_id === payload.sessionId);
    const sessionEntryRaw = response.session ?? (sessionIndex >= 0 ? rawEntries[sessionIndex] : null);
    const sessionEntry = sessionEntryRaw
      ? normalizeEntry(
          sessionEntryRaw,
          sessionIndex >= 0 ? sessionIndex : normalized.findIndex(item => item.sessionId === sessionEntryRaw.session_id)
        )
      : null;

    return {
      leaderboard: normalized,
      sessionEntry
    };
  } catch (error) {
    console.error('Failed to update leaderboard score:', error);
    return null;
  }
}
