<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div
    class="mx-auto w-full max-w-sm py-8 lg:grid lg:h-[700px] lg:max-w-5xl lg:grid-cols-2 lg:gap-0 lg:py-0"
  >
    <!--
      Mobile: single centered column.
      Desktop: brand panel left, form right, in one fixed-size frame shared by every auth page
      (login, signup, password reset…), so switching between them doesn't shift anything.
    -->
    <aside
      class="relative hidden overflow-hidden rounded-l-2xl border border-r-0 border-line bg-gradient-to-br from-blood-dim via-surface to-bg lg:flex lg:flex-col lg:justify-between lg:p-10"
    >
      <img
        src="/home.png"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-[65%_center] opacity-40"
      />
      <AnimatedLogo
        variant="full"
        :size="96"
        intro
        motion="heartbeat"
        class="relative text-fg"
      />
      <div class="relative">
        <p class="font-digital mb-2 tracking-[0.3em] text-blood-text">
          AVIATION · BANGLADESH
        </p>
        <p class="text-3xl leading-tight font-bold">
          Lend a hand.<br />
          <span class="text-blood-text">Give blood.</span>
        </p>
        <p class="mt-3 max-w-xs text-sm text-soft">
          A blood donor network for aviation students and airline professionals.
        </p>
      </div>
    </aside>

    <div
      class="lg:flex lg:flex-col lg:overflow-y-auto lg:[&>*]:shrink-0 lg:[&>*:first-child]:mt-auto lg:[&>*:last-child]:mb-auto lg:rounded-r-2xl lg:border lg:border-line lg:bg-surface lg:px-14 lg:py-10"
    >
      <div
        class="mb-6 flex flex-col items-center text-center lg:items-start lg:text-left"
      >
        <AnimatedLogo :size="76" intro motion="hover" class="mb-4 lg:hidden" />
        <h1 class="text-2xl font-bold lg:text-3xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-muted">{{ subtitle }}</p>
      </div>
      <div class="card p-5 lg:border-0 lg:bg-transparent lg:p-0">
        <slot />
      </div>
      <div class="mt-4 text-center text-sm text-muted lg:mt-6 lg:text-left">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
