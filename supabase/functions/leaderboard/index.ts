import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
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

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const { data, error } = await supabase
    .from("game_sessions")
    .select("session_id, player_name, is_human, level_reached, total_moves, updated_at")
    .not("player_name", "is", null)
    .neq("player_name", "")
    .order("level_reached", { ascending: false })
    .order("total_moves", { ascending: true })
    .order("updated_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("leaderboard fetch failed", error);
    return new Response(
      JSON.stringify({ error: "Unable to load leaderboard" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify(data ?? []),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
