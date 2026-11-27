<script setup lang="ts">
useHead({ title: "Log in" });

const supabase = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser();
const redirectInfo = useSupabaseCookieRedirect();

const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref("");

// Navigate exactly once. Both submit() and the user watcher fire after login;
// pluck() clears the saved redirect, so a second call would fall back to /search.
let leaving = false;
function goNext() {
  if (leaving) return;
  leaving = true;
  return navigateTo(redirectInfo.pluck() || "/search", { replace: true });
}

watch(user, (u) => u && goNext(), { immediate: true });

async function submit() {
  busy.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  busy.value = false;
  if (err) {
    if (/not confirmed/i.test(err.message)) {
      // Account exists but the email code was never entered: finish that first.
      toast.success("Almost there. Enter the code we emailed you.");
      await navigateTo({ path: "/verify", query: { email: email.value } });
      return;
    }
    error.value = err.message;
    return;
  }
  await goNext();
}
</script>

<template>
  <AuthCard
    title="Welcome back"
    subtitle="Log in to find donors and manage requests."
  >
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="label-caps">Email</span>
        <input
          v-model.trim="email"
          type="email"
          autocomplete="email"
          class="field mt-1"
          required
        />
      </label>
      <label class="block">
        <span class="flex justify-between">
          <span class="label-caps">Password</span>
          <NuxtLink
            to="/reset-password"
            class="text-xs text-blood-text hover:underline"
            >Forgot?</NuxtLink
          >
        </span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
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
        {{ busy ? "Logging in…" : "Log in" }}
      </button>
    </form>
    <template #footer>
      New to AeroAid?
      <NuxtLink
        to="/signup"
        class="font-semibold text-blood-text hover:underline"
        >Create an account</NuxtLink
      >
    </template>
  </AuthCard>
</template>
