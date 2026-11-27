<script setup lang="ts">
useHead({ title: "Confirming" });

// Email-confirmation landing page. The Supabase client exchanges the ?code= for a
// session automatically; once the user appears, continue to where they were going.
const user = useSupabaseUser();
const route = useRoute();
const redirectInfo = useSupabaseCookieRedirect();
const error = computed(() => (route.query.error_description as string) || "");

watch(
  user,
  (u) => {
    if (u) navigateTo(redirectInfo.pluck() || "/profile", { replace: true });
  },
  { immediate: true },
);
</script>

<template>
  <AuthCard title="Email confirmation">
    <div v-if="error" class="space-y-3 text-sm">
      <p class="rounded-md bg-blood-dim p-3 text-blood-text">{{ error }}</p>
      <NuxtLink to="/login" class="btn-dark w-full">Go to log in</NuxtLink>
    </div>
    <StateMessage v-else kind="loading" text="Signing you in…" />
  </AuthCard>
</template>
