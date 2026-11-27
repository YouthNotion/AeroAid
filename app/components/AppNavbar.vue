<script setup lang="ts">
const user = useSupabaseUser();
const supabase = useSupabaseClient();
const route = useRoute();
const { data: me } = await useMyProfile();

const open = ref(false); // mobile drawer
const menuOpen = ref(false); // desktop account menu
const menuRef = ref<HTMLElement>();

watch(
  () => route.fullPath,
  () => {
    open.value = false;
    menuOpen.value = false;
  },
);

// Mobile drawer: every destination in one list.
const mobileLinks = computed(() =>
  user.value
    ? [
        { to: "/search", label: "Find donors" },
        { to: "/requests", label: "Sent requests" },
        { to: "/invitations", label: "Invitations" },
        { to: "/history", label: "My donations" },
        { to: "/profile", label: "Profile" },
        { to: "/account", label: "Account" },
      ]
    : [
        { to: "/search", label: "Find donors" },
        { to: "/login", label: "Log in" },
        { to: "/signup", label: "Sign up" },
      ],
);

// Desktop: primary destinations inline, personal pages under the avatar.
const primaryLinks = computed(() =>
  user.value
    ? [
        { to: "/search", label: "Find donors" },
        { to: "/requests", label: "Sent requests" },
        { to: "/invitations", label: "Invitations" },
      ]
    : [{ to: "/search", label: "Find donors" }],
);
const menuLinks = [
  { to: "/history", label: "My donations" },
  { to: "/profile", label: "Profile" },
  { to: "/account", label: "Account settings" },
];

function onDocClick(e: MouseEvent) {
  if (
    menuOpen.value &&
    menuRef.value &&
    !menuRef.value.contains(e.target as Node)
  )
    menuOpen.value = false;
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") menuOpen.value = open.value = false;
}
onMounted(() => {
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKey);
});

async function signOut() {
  // Just this device; "Sign out everywhere" on /account uses scope "global"
  // (supabase-js defaults to global).
  await supabase.auth.signOut({ scope: "local" });
  clearNuxtData("my-profile");
  await navigateTo("/login");
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-line bg-bg/90 text-fg backdrop-blur"
  >
    <nav
      class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:h-16 lg:px-8"
    >
      <NuxtLink to="/" class="flex items-center gap-2">
        <AnimatedLogo :size="34" motion="hover" label="" />
        <span class="font-digital text-2xl tracking-widest">AEROAID</span>
      </NuxtLink>

      <!-- Desktop -->
      <div class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="l in primaryLinks"
          :key="l.to"
          :to="l.to"
          class="rounded-md px-3 py-1.5 text-sm text-soft hover:bg-white/10 hover:text-fg"
          active-class="!text-fg !bg-blood-dim"
        >
          {{ l.label }}
        </NuxtLink>

        <template v-if="!user">
          <NuxtLink
            to="/login"
            class="rounded-md px-3 py-1.5 text-sm text-soft hover:bg-white/10 hover:text-fg"
            >Log in</NuxtLink
          >
          <NuxtLink to="/signup" class="btn-primary ml-2 py-1.5"
            >Become a donor</NuxtLink
          >
        </template>

        <div v-else ref="menuRef" class="relative ml-3">
          <button
            class="flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 transition hover:border-blood-line"
            :class="{ 'border-blood-line bg-blood-dim': menuOpen }"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="menuOpen = !menuOpen"
          >
            <AvatarImage
              :path="me?.avatar_url"
              :version="me?.updated_at"
              :size="28"
            />
            <span class="max-w-32 truncate text-sm">{{
              me?.full_name?.split(" ")[0] || "Account"
            }}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-muted"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div
            v-if="menuOpen"
            role="menu"
            class="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl shadow-black"
          >
            <div class="flex items-center gap-3 border-b border-line p-3">
              <AvatarImage
                :path="me?.avatar_url"
                :version="me?.updated_at"
                :size="40"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">
                  {{ me?.full_name || "Your account" }}
                </p>
                <p class="truncate text-xs text-muted">{{ user.email }}</p>
              </div>
            </div>
            <NuxtLink
              v-for="l in menuLinks"
              :key="l.to"
              :to="l.to"
              role="menuitem"
              class="block px-4 py-2.5 text-sm text-soft hover:bg-raised hover:text-fg"
              active-class="!text-fg bg-blood-dim"
            >
              {{ l.label }}
            </NuxtLink>
            <button
              role="menuitem"
              class="block w-full border-t border-line px-4 py-2.5 text-left text-sm text-blood-text hover:bg-raised"
              @click="signOut"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile -->
      <button
        class="rounded-md p-2 hover:bg-white/10 md:hidden"
        :aria-expanded="open"
        aria-label="Menu"
        @click="open = !open"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path v-if="!open" d="M4 7h16M4 12h16M4 17h16" />
          <path v-else d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </nav>

    <div v-if="open" class="border-t border-line px-4 pb-3 md:hidden">
      <NuxtLink
        v-for="l in mobileLinks"
        :key="l.to"
        :to="l.to"
        class="block rounded-md px-3 py-2.5 text-soft hover:bg-white/10"
        active-class="!text-fg !bg-blood-dim"
      >
        {{ l.label }}
      </NuxtLink>
      <button
        v-if="user"
        class="block w-full rounded-md px-3 py-2.5 text-left text-blood-text hover:bg-white/10"
        @click="signOut"
      >
        Sign out
      </button>
    </div>
  </header>
</template>
