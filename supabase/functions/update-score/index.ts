import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

type UpdateScorePayload = {
  sessionId?: string;
  levelReached?: number;
  totalMoves?: number;
  playerName?: string | null;
  isHuman?: boolean | null;
};

type LeaderboardRow = {
  session_id: string;
  player_name: string | null;
  is_human: boolean | null;
  level_reached: number;
  total_moves: number;
  updated_at: string;
};

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
};

const supabaseUrl = getEnv("SUPABASE_URL");
const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const sanitizeName = (name: string | null | undefined): string | null => {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 16);
};

const collectLeaderboard = async (): Promise<LeaderboardRow[]> => {
  const { data, error } = await supabase
    .from<LeaderboardRow>("game_sessions")
    .select("session_id, player_name, is_human, level_reached, total_moves, updated_at")
    .not("player_name", "is", null)
    .neq("player_name", "")
    .order("level_reached", { ascending: false })
    .order("total_moves", { ascending: true })
    .order("updated_at", { ascending: true })
    .limit(10);

  if (error) {
    throw error;
  }

  return data ?? [];
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let payload: UpdateScorePayload;
  try {
    payload = await request.json();
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const sessionId = payload.sessionId;
  const levelReached = payload.levelReached;
  const totalMoves = payload.totalMoves;

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: "sessionId is required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  if (typeof levelReached !== "number" || typeof totalMoves !== "number") {
    return new Response(
      JSON.stringify({ error: "levelReached and totalMoves must be numbers" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const playerName = sanitizeName(payload.playerName);
  const isHuman = typeof payload.isHuman === "boolean" ? payload.isHuman : null;

  const { data: sessionRow, error: fetchError } = await supabase
    .from("game_sessions")
    .select("session_id, player_name, is_human, level_reached, total_moves, updated_at")
    .eq("session_id", sessionId)
    .single();

  if (fetchError || !sessionRow) {
    console.error("update-score missing session", fetchError);
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const updates = {
    level_reached: Math.max(levelReached, sessionRow.level_reached ?? 0),
    total_moves: totalMoves,
    player_name: playerName ?? sessionRow.player_name,
    is_human: isHuman ?? sessionRow.is_human
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from("game_sessions")
    .update(updates)
    .eq("session_id", sessionId)
    .select("session_id, player_name, is_human, level_reached, total_moves, updated_at");

  if (updateError) {
    console.error("update-score update failed", updateError);
    return new Response(
      JSON.stringify({ error: "Unable to update session" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  let leaderboard: LeaderboardRow[] = [];
  try {
    leaderboard = await collectLeaderboard();
  } catch (error) {
    console.error("update-score leaderboard fetch failed", error);
  }

  const sessionEntry = updatedRows?.[0] ?? sessionRow;

  return new Response(
    JSON.stringify({
      leaderboard,
      session: sessionEntry
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
