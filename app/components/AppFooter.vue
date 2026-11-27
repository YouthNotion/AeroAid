<script setup lang="ts">
const year = new Date().getFullYear();

// AeroAid emergency hotlines.
const EMERGENCY = [
  { display: "01792-660291", tel: "+8801792660291" },
  { display: "01728-144233", tel: "+8801728144233" },
];
</script>

<template>
  <footer class="border-t border-line bg-bg">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:justify-between lg:px-8"
    >
      <p class="sm:order-1">© {{ year }} AeroAid. All rights reserved.</p>

      <p
        class="order-first inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:order-2"
      >
        <span class="font-semibold tracking-wider text-blood-text uppercase"
          >Emergency</span
        >
        <template v-for="(n, i) in EMERGENCY" :key="n.tel">
          <span v-if="i" class="text-subtle">·</span>
          <a
            :href="`tel:${n.tel}`"
            class="font-semibold text-fg tabular-nums hover:text-blood-text"
            >{{ n.display }}</a
          >
        </template>
      </p>

      <a
        href="https://youthnotion.orgs.bd"
        target="_blank"
        rel="noopener"
        class="group inline-flex items-center gap-1.5 hover:text-fg sm:order-3"
      >
        Made and powered by
        <img
          src="/partners/youth-notion.webp"
          alt=""
          width="16"
          height="16"
          class="h-4 w-4"
        />
        <span class="font-semibold text-soft group-hover:text-fg"
          >Youth Notion</span
        >
      </a>
    </div>
  </footer>
</template>
