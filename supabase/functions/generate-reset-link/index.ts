// Edge function: admin generates a one-time password reset token (internal flow).
// Returns an app URL like https://app.example.com/reset-password?token=xxx
// Token is stored hashed in DB; admin/management only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  // base64url
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const allowed = (roles || []).some((r: any) => r.role === "admin" || r.role === "management");
    if (!allowed) return json({ error: "Forbidden: admin/management only" }, 403);

    const body = await req.json().catch(() => ({}));
    const { request_id, email, app_url } = body || {};
    if (!request_id || !email) return json({ error: "request_id and email required" }, 400);
    if (!app_url) return json({ error: "app_url required" }, 400);

    // Generate one-time token & store hash
    const token = randomToken(32);
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const resetUrl = `${app_url.replace(/\/$/, "")}/reset-password?token=${token}`;

    const { error: upErr } = await admin
      .from("password_reset_requests")
      .update({
        status: "link_generated",
        reset_link: resetUrl,
        token_hash: tokenHash,
        link_expires_at: expiresAt,
        used_at: null,
        handled_by: userData.user.id,
        handled_at: new Date().toISOString(),
      })
      .eq("id", request_id);
    if (upErr) return json({ error: upErr.message }, 500);

    return json({ reset_link: resetUrl, expires_at: expiresAt });
  } catch (e: any) {
    return json({ error: e?.message || "Internal error" }, 500);
  }
});
