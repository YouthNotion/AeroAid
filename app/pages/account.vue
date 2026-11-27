<script setup lang="ts">
useHead({ title: "Account" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

// Changing email is deliberately not offered yet: it sends two emails at once and
// the built-in Supabase mailer only allows 2 per hour. Revisit after custom SMTP.
// (The code-based email-change template is already set up in Supabase.)

const password = ref("");
const confirmPassword = ref("");
const pwBusy = ref(false);
async function changePassword() {
  if (password.value.length < 8)
    return toast.error("Password must be at least 8 characters.");
  if (password.value !== confirmPassword.value)
    return toast.error("Passwords don't match.");
  pwBusy.value = true;
  const { error } = await supabase.auth.updateUser({
    password: password.value,
  });
  pwBusy.value = false;
  if (error) return toast.error(error.message);
  toast.success("Password updated.");
  password.value = confirmPassword.value = "";
}

async function signOutEverywhere() {
  if (!confirm("Sign out on all devices?")) return;
  await supabase.auth.signOut({ scope: "global" });
  clearNuxtData("my-profile");
  await navigateTo("/login");
}
</script>

<template>
  <div
    class="mx-auto grid max-w-md gap-6 lg:max-w-4xl lg:grid-cols-2 lg:items-start"
  >
    <PageHeader
      title="Account"
      :subtitle="`Signed in as ${user?.email ?? ''}`"
      class="!mb-0 lg:col-span-2"
    />

    <form class="card space-y-4 p-5" @submit.prevent="changePassword">
      <h2 class="font-semibold">Change password</h2>
      <label class="block">
        <span class="label-caps">New password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="field mt-1"
          required
          minlength="8"
        />
      </label>
      <label class="block">
        <span class="label-caps">Confirm password</span>
        <input
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          class="field mt-1"
          required
        />
      </label>
      <button class="btn-dark w-full" :disabled="pwBusy">
        {{ pwBusy ? "Saving…" : "Update password" }}
      </button>
    </form>

    <div class="card p-5">
      <div>
        <h2 class="font-semibold">Sessions</h2>
        <p class="mt-1 mb-4 text-sm text-muted">
          Signs you out on every phone and computer.
        </p>
      </div>
      <button
        class="btn-ghost w-full text-blood-text"
        @click="signOutEverywhere"
      >
        Sign out everywhere
      </button>
    </div>
  </div>
</template>
