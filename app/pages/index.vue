<script setup lang="ts">
definePageMeta({ layout: "landing" });
useHead({
  title: "Blood donor network for aviation",
  titleTemplate: "AeroAid · %s",
});

const user = useSupabaseUser();
const supabase = useSupabaseClient();

// Live availability per blood group (desktop strip).
const { data: groups } = await useAsyncData(
  "landing-availability",
  async () => {
    const { data } = await supabase
      .from("profiles")
      .select("blood_group, is_available");
    const counts = Object.fromEntries(
      BLOOD_GROUPS.map((g) => [g, { total: 0, available: 0 }]),
    );
    for (const p of data ?? []) {
      const c = p.blood_group && counts[p.blood_group];
      if (!c) continue;
      c.total++;
      if (p.is_available) c.available++;
    }
    return BLOOD_GROUPS.map((g) => ({ group: g, ...counts[g]! }));
  },
);

const steps = [
  {
    n: "01",
    title: "Join as a donor",
    text: "Sign up with your blood group and area. It takes a minute.",
  },
  {
    n: "02",
    title: "Get requested",
    text: "Members in need find you by blood group and area and send a request.",
  },
  {
    n: "03",
    title: "Donate & log it",
    text: "Accept, donate, and your history keeps track of when you last gave.",
  },
];
</script>

<template>
  <main class="flex flex-1 flex-col">
    <!-- Hero -->
    <section
      class="relative flex flex-1 flex-col overflow-hidden lg:min-h-[calc(100dvh-4rem)] lg:flex-none"
    >
      <img
        src="/home.png"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-80 md:object-contain md:object-right"
      />
      <div
        class="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-bg via-bg/70 to-transparent lg:block"
      />
      <div
        class="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pt-24 pb-14 md:justify-center lg:px-8"
      >
        <AnimatedLogo
          variant="full"
          :size="132"
          intro
          motion="heartbeat"
          class="mb-8 text-white lg:mb-10"
        />
        <p class="font-digital mb-3 text-lg tracking-[0.3em] text-blood-text">
          AVIATION · BANGLADESH
        </p>
        <h1
          class="max-w-md text-4xl leading-tight font-bold md:text-5xl lg:max-w-xl lg:text-6xl"
        >
          Lend a hand.<br />
          <span class="text-blood-text">Give blood.</span>
        </h1>
        <p class="mt-4 max-w-sm text-soft lg:max-w-md lg:text-lg">
          AeroAid connects aviation students and airline professionals so no one
          in our community waits for blood in an emergency.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/search" class="btn-primary px-6 py-3 text-base"
            >Find a donor</NuxtLink
          >
          <NuxtLink
            v-if="!user"
            to="/signup"
            class="btn-ghost px-6 py-3 text-base"
            >Become a donor</NuxtLink
          >
          <NuxtLink
            v-else
            to="/invitations"
            class="btn-ghost px-6 py-3 text-base"
            >My invitations</NuxtLink
          >
        </div>
      </div>
    </section>

    <!-- Desktop-only sections -->
    <section class="hidden border-t border-line lg:block">
      <div class="mx-auto max-w-6xl px-8 py-16">
        <div class="mb-8 flex items-end justify-between">
          <div>
            <p class="label-caps">Right now</p>
            <h2 class="mt-1 text-2xl font-bold">
              Donors available by blood group
            </h2>
          </div>
          <NuxtLink
            to="/search?available=1"
            class="text-sm font-semibold text-blood-text hover:underline"
            >See all available →</NuxtLink
          >
        </div>
        <div class="grid grid-cols-8 gap-3">
          <NuxtLink
            v-for="g in groups"
            :key="g.group"
            :to="{ path: '/search', query: { bloodGroup: g.group } }"
            class="card flex flex-col items-center gap-2 py-6 transition hover:border-blood-line hover:bg-blood-dim"
          >
            <span class="text-2xl font-bold text-blood-text">{{
              g.group
            }}</span>
            <span class="font-digital text-4xl leading-none text-fg">{{
              String(g.available).padStart(2, "0")
            }}</span>
            <span class="text-xs text-muted">of {{ g.total }} donors</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="hidden border-t border-line lg:block">
      <div class="mx-auto max-w-6xl px-8 py-16">
        <p class="label-caps">How it works</p>
        <div class="mt-6 grid grid-cols-3 gap-6">
          <div v-for="s in steps" :key="s.n" class="card p-6">
            <span class="font-digital text-4xl text-blood-text">{{ s.n }}</span>
            <h3 class="mt-3 text-lg font-semibold">{{ s.title }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-muted">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
