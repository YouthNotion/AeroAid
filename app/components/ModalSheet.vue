<script setup lang="ts">
defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center"
      @click.self="emit('close')"
    >
      <div
        class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 class="mb-4 text-lg font-bold">{{ title }}</h2>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
