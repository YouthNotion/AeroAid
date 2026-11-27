<script setup lang="ts">
defineProps<{ kind?: "loading" | "empty" | "error"; text?: string }>();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm"
  >
    <span
      v-if="kind === 'loading'"
      class="h-7 w-7 animate-spin rounded-full border-3 border-line-strong border-t-red-600"
      role="status"
      aria-label="Loading"
    />
    <p
      v-if="text || kind !== 'loading'"
      :class="kind === 'error' ? 'font-semibold text-blood-text' : 'text-muted'"
    >
      {{
        text ||
        (kind === "error" ? "Something went wrong." : "Nothing here yet.")
      }}
    </p>
    <slot />
  </div>
</template>
