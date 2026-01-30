/**
 * Health check endpoint for deployment monitoring.
 * Returns { ok: true } if the app is running.
 * Optionally verifies Supabase connection.
 */

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // Basic health check
    const health: {
      ok: boolean;
      timestamp: string;
      uptime: number;
      supabase?: {
        connected: boolean;
        latencyMs?: number;
        error?: string;
      };
    } = {
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    // Optional: Verify Supabase connection with a lightweight query
    try {
      const supabase = await createClient();
      const supabaseStart = Date.now();

      // Simple query to verify connection - just check auth (no data access needed)
      const { error } = await supabase.auth.getSession();

      health.supabase = {
        connected: !error,
        latencyMs: Date.now() - supabaseStart,
      };

      if (error) {
        health.supabase.error = error.message;
      }
    } catch (supabaseError) {
      health.supabase = {
        connected: false,
        error:
          supabaseError instanceof Error
            ? supabaseError.message
            : "Unknown error",
      };
    }

    return Response.json(health, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Response-Time": `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
