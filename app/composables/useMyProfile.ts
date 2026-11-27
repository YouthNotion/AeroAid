import type { Profile } from "~/types/database.types";

/** The signed-in user's profile row, shared across the app. */
export function useMyProfile() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  return useAsyncData<Profile | null>(
    "my-profile",
    async () => {
      if (!user.value) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.value.sub)
        .maybeSingle();
      if (error) throw error;

      // Signup stores the phone number in the auth metadata because the profile
      // can't be written until the email is confirmed. Copy it over the first
      // time we see the profile without one.
      const meta = user.value.user_metadata as
        Record<string, unknown> | undefined;
      const signupPhone = typeof meta?.contact === "string" ? meta.contact : "";
      if (data && !data.contact && /^01[3-9]\d{8}$/.test(signupPhone)) {
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ contact: signupPhone })
          .eq("id", data.id);
        if (!upErr) data.contact = signupPhone;
      }
      return data;
    },
    { watch: [() => user.value?.sub] },
  );
}
