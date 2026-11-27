<script setup lang="ts">
defineProps<{ title: string; count?: number | null; subtitle?: string }>();
</script>

<template>
  <div class="mb-6 flex items-end justify-between gap-4">
    <div>
      <h1
        class="inline-block bg-blood px-2 py-0.5 text-sm font-bold tracking-[0.2em] text-white uppercase"
      >
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-2 text-sm text-muted">{{ subtitle }}</p>
    </div>
    <div
      v-if="count !== undefined && count !== null"
      class="font-digital rounded-md border border-blood-line bg-surface-2 px-3 py-1 text-4xl leading-none text-blood-text"
      :aria-label="`${count} items`"
    >
      {{ String(count).padStart(2, "0") }}
    </div>
  </div>
</template>
