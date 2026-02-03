import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export type ProfileResult =
  | { success: true; data: Profile }
  | { success: false; error: string };

/**
 * Get profile for the current user.
 */
export async function getProfile(): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (error) {
    // If no profile exists, return defaults
    if (error.code === "PGRST116") {
      return {
        success: true,
        data: {
          id: user.id,
          firstName: null,
          lastName: null,
        },
      };
    }
    console.error("Error getting profile:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      id: data.id,
      firstName: data.first_name as string | null,
      lastName: data.last_name as string | null,
    },
  };
}

/**
 * Update profile using upsert to handle missing rows.
 */
export async function updateProfile(
  profile: Partial<Pick<Profile, "firstName" | "lastName">>
): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updateData: Record<string, unknown> = {
    id: user.id,
  };

  if (profile.firstName !== undefined) {
    updateData.first_name = profile.firstName;
  }

  if (profile.lastName !== undefined) {
    updateData.last_name = profile.lastName;
  }

  // Use upsert to handle case where row doesn't exist
  const { data, error } = await supabase
    .from("profiles")
    .upsert(updateData, { onConflict: "id" })
    .select("id, first_name, last_name")
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      id: data.id,
      firstName: data.first_name as string | null,
      lastName: data.last_name as string | null,
    },
  };
}
