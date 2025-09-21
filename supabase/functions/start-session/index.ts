import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type StartSessionPayload = {
  userAgent?: string | null;
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

const getClientIp = (request: Request): string | null => {
  const headers = request.headers;
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    return first?.trim() ?? null;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let payload: StartSessionPayload = {};
  try {
    payload = await request.json();
  } catch (_error) {
    // Ignore bad JSON, we'll fallback to headers defaults below
  }

  const ipAddress = getClientIp(request);
  const userAgent = payload.userAgent ?? request.headers.get("user-agent") ?? null;

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      ip_address: ipAddress,
      user_agent: userAgent
    })
    .select("session_id")
    .single();

  if (error) {
    console.error("start-session insert failed", error);
    return new Response(
      JSON.stringify({ error: "Unable to create session" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ sessionId: data.session_id }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
