<script setup lang="ts">
const user = useSupabaseUser();
const route = useRoute();
const { data: profile } = await useMyProfile();

const needsProfile = computed(
  () =>
    !!user.value &&
    !!profile.value &&
    (!profile.value.area_name || !profile.value.contact) &&
    route.path !== "/profile",
);
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppNavbar />
    <NuxtLink
      v-if="needsProfile"
      to="/profile"
      class="block bg-amber-950 px-4 py-2 text-center text-sm text-amber-200 hover:bg-amber-900"
    >
      Add your area and contact number so requesters can reach you →
    </NuxtLink>
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
      <slot />
    </main>
    <AppFooter />
    <ToastHost />
  </div>
</template>
