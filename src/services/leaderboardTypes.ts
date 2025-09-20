export interface LeaderboardEntry {
  sessionId: string;
  playerName: string;
  isHuman: boolean | null;
  levelReached: number;
  totalMoves: number;
  rank: number;
}

export interface LeaderboardRecordResult {
  rank: number | null;
  entry: LeaderboardEntry | null;
  shouldPromptName: boolean;
}
