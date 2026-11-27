import type { Profile } from "~/types/database.types";

/**
 * Fetches the signed-in user's profile. Defined once at module level so every
 * useMyProfile() call shares the same handler for the "my-profile" key (Nuxt
 * requires calls with one key to use one handler, or the data can diverge).
 */
async function fetchMyProfile(): Promise<Profile | null> {
  // Nuxt runs the handler inside the app context; composables must be called
  // before the first await.
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  if (!user.value) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.value.sub)
    .maybeSingle();
  if (error) throw error;

  // Signup stores the phone number in the auth metadata because the profile
  // can't be written until the email is confirmed. Copy it over ONCE, then
  // clear it from the metadata so a number the user later removes stays removed.
  // (Client only: the browser holds the session that can update metadata.)
  const meta = user.value.user_metadata as Record<string, unknown> | undefined;
  const signupPhone = typeof meta?.contact === "string" ? meta.contact : "";
  if (import.meta.client && data && signupPhone) {
    // Only on a never-saved profile: the login token can carry the old
    // metadata for up to an hour after it's cleared.
    const neverSaved = !data.updated_at;
    if (neverSaved && !data.contact && /^01[3-9]\d{8}$/.test(signupPhone)) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ contact: signupPhone })
        .eq("id", data.id);
      if (!upErr) data.contact = signupPhone;
    }
    await supabase.auth.updateUser({ data: { contact: null } });
  }
  return data;
}

/** The signed-in user's profile row, shared across the app. */
export function useMyProfile() {
  const user = useSupabaseUser();
  return useAsyncData<Profile | null>("my-profile", fetchMyProfile, {
    watch: [() => user.value?.sub],
  });
}
