<script setup lang="ts">
defineProps<{ group?: string | null }>();
</script>

<template>
  <span
    class="inline-flex min-w-11 justify-center rounded-full border border-blood-line bg-blood-dim px-2.5 py-0.5 text-sm font-bold text-blood-text"
  >
    {{ group || "—" }}
  </span>
</template>
