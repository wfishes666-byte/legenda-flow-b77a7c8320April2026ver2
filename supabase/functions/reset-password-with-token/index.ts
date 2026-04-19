// Edge function: validates a one-time reset token and updates the user's password.
// Public endpoint (no auth required) — security relies on the unguessable token.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const { token, new_password, mode } = body || {};
    if (!token) return json({ error: "Token wajib diisi" }, 400);

    const tokenHash = await sha256Hex(String(token));
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: row, error: selErr } = await admin
      .from("password_reset_requests")
      .select("id, email, status, link_expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (selErr) return json({ error: selErr.message }, 500);
    if (!row) return json({ error: "Token tidak valid" }, 400);
    if (row.used_at) return json({ error: "Link sudah pernah dipakai" }, 400);
    if (row.link_expires_at && new Date(row.link_expires_at) < new Date()) {
      return json({ error: "Link sudah kadaluarsa, minta admin generate ulang" }, 400);
    }

    // Mode "verify" hanya cek validitas (untuk halaman menampilkan form)
    if (mode === "verify") {
      return json({ valid: true, email: row.email });
    }

    // Mode "reset" — update password
    if (!new_password || String(new_password).length < 6) {
      return json({ error: "Password minimal 6 karakter" }, 400);
    }

    // Cari user berdasarkan email
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) return json({ error: listErr.message }, 500);
    const target = list.users.find((u) => (u.email || "").toLowerCase() === row.email.toLowerCase());
    if (!target) return json({ error: "User tidak ditemukan" }, 404);

    const { error: updErr } = await admin.auth.admin.updateUserById(target.id, {
      password: String(new_password),
    });
    if (updErr) return json({ error: updErr.message }, 500);

    await admin
      .from("password_reset_requests")
      .update({
        status: "completed",
        used_at: new Date().toISOString(),
        token_hash: null, // invalidate
      })
      .eq("id", row.id);

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e?.message || "Internal error" }, 500);
  }
});
