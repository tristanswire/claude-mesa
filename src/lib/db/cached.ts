/**
 * Cached data fetching functions using React's cache().
 *
 * These functions wrap commonly-fetched data to deduplicate requests
 * within a single render cycle. In Next.js App Router, when both a layout
 * and a page fetch the same data, using cache() ensures only one
 * database call is made.
 *
 * Usage:
 *   import { getCachedPreferences, getCachedProfile } from "@/lib/db/cached";
 *
 * Note: cache() only deduplicates within the same request/render.
 * It does NOT persist across requests like unstable_cache would.
 */

import { cache } from "react";
import { getUserPreferences, type PreferencesResult } from "./user-preferences";
import { getProfile, type ProfileResult } from "./profiles";
import { getEntitlementsForUser, type EntitlementsResult } from "./entitlements";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached version of getUserPreferences().
 * Deduplicates calls within the same request.
 */
export const getCachedPreferences = cache(async (): Promise<PreferencesResult> => {
  return getUserPreferences();
});

/**
 * Cached version of getProfile().
 * Deduplicates calls within the same request.
 */
export const getCachedProfile = cache(async (): Promise<ProfileResult> => {
  return getProfile();
});

/**
 * Cached version of getEntitlementsForUser().
 * Deduplicates calls within the same request.
 */
export const getCachedEntitlements = cache(async (): Promise<EntitlementsResult> => {
  return getEntitlementsForUser();
});

/**
 * Cached version of supabase.auth.getUser().
 * Deduplicates auth calls within the same request.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

/**
 * Fetch all common dashboard data in a single call.
 * This is an optimization for pages that need multiple pieces of data.
 * All underlying calls are cached, so calling this multiple times
 * won't result in extra database queries.
 */
export async function getDashboardData() {
  const [userResult, preferencesResult, profileResult] = await Promise.all([
    getCachedUser(),
    getCachedPreferences(),
    getCachedProfile(),
  ]);

  return {
    user: userResult.data.user,
    preferences: preferencesResult.success ? preferencesResult.data : null,
    profile: profileResult.success ? profileResult.data : null,
  };
}
