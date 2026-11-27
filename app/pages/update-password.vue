<script setup lang="ts">
useHead({ title: "Choose a new password" });

// Reached from the password-reset email. The Supabase client exchanges the ?code= in
// the URL for a session on load, so wait for the user before allowing the update.
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const toast = useToast();

const password = ref("");
const confirm = ref("");
const busy = ref(false);
const error = ref((route.query.error_description as string) || "");

async function submit() {
  error.value = "";
  if (password.value.length < 8)
    return (error.value = "Password must be at least 8 characters.");
  if (password.value !== confirm.value)
    return (error.value = "Passwords don't match.");
  busy.value = true;
  const { error: err } = await supabase.auth.updateUser({
    password: password.value,
  });
  busy.value = false;
  if (err) return (error.value = err.message);
  toast.success("Password updated.");
  await navigateTo("/search", { replace: true });
}
</script>

<template>
  <AuthCard title="Choose a new password">
    <StateMessage
      v-if="!user && !error"
      kind="loading"
      text="Verifying your reset link…"
    />
    <form v-else-if="user" class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="label-caps">New password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="field mt-1"
          required
        />
      </label>
      <label class="block">
        <span class="label-caps">Confirm password</span>
        <input
          v-model="confirm"
          type="password"
          autocomplete="new-password"
          class="field mt-1"
          required
        />
      </label>
      <p
        v-if="error"
        class="rounded-md bg-blood-dim p-3 text-sm text-blood-text"
      >
        {{ error }}
      </p>
      <button class="btn-primary w-full" :disabled="busy">
        {{ busy ? "Saving…" : "Update password" }}
      </button>
    </form>
    <div v-else class="space-y-3 text-sm">
      <p class="rounded-md bg-blood-dim p-3 text-blood-text">{{ error }}</p>
      <NuxtLink to="/reset-password" class="btn-dark w-full"
        >Request a new link</NuxtLink
      >
    </div>
  </AuthCard>
</template>
