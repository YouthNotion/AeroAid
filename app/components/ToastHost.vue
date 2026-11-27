<script setup lang="ts">
const { toasts, dismiss } = useToast();
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    aria-live="polite"
  >
    <button
      v-for="t in toasts"
      :key="t.id"
      class="pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-left text-sm font-medium text-white shadow-lg"
      :class="
        t.kind === 'error' ? 'bg-blood' : 'border border-line-strong bg-raised'
      "
      @click="dismiss(t.id)"
    >
      {{ t.text }}
    </button>
  </div>
</template>
