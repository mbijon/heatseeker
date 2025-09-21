# Leaderboard Feature Roadmap

## Data & Supabase Setup
- Create `game_sessions` table with fields: `session_id` (UUID PK), `ip_address` (inet), `user_agent` (text), `is_human` (boolean, nullable), `level_reached` (integer, default 0), `total_moves` (integer, default 0), `player_name` (varchar(16), nullable), `created_at`/`updated_at` (timestamps). Add index on `(level_reached DESC, total_moves ASC, updated_at ASC)`.
- Enable RLS and expose two edge functions to capture the client IP without trusting the browser.
  - `start-session`: inserts a new row using request IP headers and returns the generated `session_id`.
  - `update-score`: upserts level + moves, optional `player_name`, `is_human`, and returns the current top 10 (excluding blank names).
- Configure Supabase client in Vite with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for calling the functions.

## Client State Management
- Extend `Heatseeker` with `sessionId`, `leaderboard`, `playerRank`, `hasSubmittedName`, `isHuman`, `showNameModal`, and `pendingHighlight` state.
- Add a `useLeaderboard` helper hook that:
  - Calls `start-session` once when the user hits `Start Game` and stores the `sessionId`.
  - On win or loss, calls `update-score` with the latest `level_reached` (1-indexed) and `totalMoves`, optionally `player_name` / `is_human`.
  - Updates local leaderboard data plus the player’s rank.
- Derive the player entry from the returned leaderboard for row highlighting.

## Ranking & Filtering Rules
- Trust server ordering by level desc, moves asc, updated_at asc. Map directly to ranks 1–10 on the client.
- Ensure blank or skipped names (`NULL` or empty string) are filtered server side and double-checked client side.
- Trigger the name modal only when the player is within the top 10 and has not already submitted a name.

## UI Enhancements
- Replace the placeholder list on the start screen with a console-style table (`#`, `Name`, `Type`, `Level`, `Moves`) using mono fonts and neon palette.
- Highlight the current player’s row with a brighter background when `playerRank` exists and `player_name` is set.
- Implement `LeaderboardModal` that collects a 16-char name and “Are you human?” checkbox with `Save` and `Skip` actions. Disable save while the request is pending; allow skip to continue without a name.
- After each level completion, pause progression until leaderboard updates. If top 10 without a name, show the modal before allowing the next level to start.

## Endgame Behaviour
- Final level win or loss displays “You have completed all levels! Congratulations!!!” followed by the leaderboard.
- If the player already submitted a name earlier, highlight them in the final list. If they qualify but remain unnamed, force the modal before leaving the end screen (skip still allowed).
- Ensure nameless players never appear in the leaderboard output.

## Error Handling & Testing
- Show a fallback message (“Leaderboard unavailable”) when Supabase calls fail; allow gameplay to continue.
- Log errors and retry updates on the next level completion.
- Unit test ranking helpers, modal trigger logic, and Supabase hook (with mocked responses). Add UI tests to cover top-10 prompts, skip path, final highlight, and modal submission.
