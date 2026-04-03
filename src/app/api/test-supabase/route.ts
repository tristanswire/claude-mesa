import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...`
        : "MISSING",
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10) + "..."
        : "MISSING",
      anonKeyLooksLikeJWT: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("eyJ") ?? false,
    },
  };

  // Test 1: Auth session
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    results.authSession = {
      ok: !error,
      hasSession: !!data?.session,
      error: error?.message ?? null,
    };
  } catch (e) {
    results.authSession = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Test 2: Basic DB query (profiles table)
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    results.dbQuery = {
      ok: !error,
      error: error?.message ?? null,
      hint: error?.hint ?? null,
    };
  } catch (e) {
    results.dbQuery = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const allOk =
    (results.authSession as { ok: boolean }).ok &&
    (results.dbQuery as { ok: boolean }).ok;

  return Response.json(
    { ok: allOk, ...results },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
