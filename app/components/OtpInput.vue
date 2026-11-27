<script setup lang="ts">
import { animate, stagger } from "animejs";

/**
 * One-time code as single-digit cells (default 6). Same behaviour as PhoneInput:
 * fills from the left, Backspace steps back, arrows move, paste fills every cell.
 * Emits `complete` with the code once every cell is filled.
 */
const props = withDefaults(
  defineProps<{
    length?: number;
    disabled?: boolean;
    error?: boolean;
    autofocus?: boolean;
  }>(),
  { length: 6, disabled: false, error: false, autofocus: true },
);
const model = defineModel<string>({ default: "" });
const emit = defineEmits<{ complete: [string] }>();

const cells = ref<HTMLInputElement[]>([]);
const digits = ref<string[]>(Array(props.length).fill(""));

watch(
  model,
  (v) => {
    const d = (v || "").replace(/\D/g, "").slice(0, props.length);
    if (d !== digits.value.join(""))
      digits.value = Array.from({ length: props.length }, (_, i) => d[i] ?? "");
  },
  { immediate: true },
);

const complete = computed(() => digits.value.every(Boolean));

function sync() {
  model.value = digits.value.join("");
  if (complete.value) emit("complete", model.value);
}
function focusCell(i: number) {
  const el = cells.value[Math.max(0, Math.min(props.length - 1, i))];
  el?.focus();
  el?.select();
}
function fillFrom(i: number, text: string) {
  const d = text.replace(/\D/g, "");
  if (!d) return;
  const start = d.length >= props.length ? 0 : i;
  for (let k = 0; k < d.length && start + k < props.length; k++)
    digits.value[start + k] = d[k]!;
  focusCell(Math.min(start + d.length, props.length - 1));
  sync();
}

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement;
  const typed = el.value;
  el.value = digits.value[i] ?? "";
  if (!typed) {
    digits.value[i] = "";
    sync();
    return;
  }
  const newest = typed.replace(digits.value[i] ?? "", "") || typed;
  fillFrom(i, newest.length > 1 ? typed : newest);
}
function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace") {
    e.preventDefault();
    if (digits.value[i]) digits.value[i] = "";
    else if (i > 0) {
      digits.value[i - 1] = "";
      focusCell(i - 1);
    }
    sync();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    focusCell(i - 1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    focusCell(i + 1);
  } else if (
    e.key.length === 1 &&
    !/\d/.test(e.key) &&
    !e.ctrlKey &&
    !e.metaKey
  ) {
    e.preventDefault();
  }
}
function onFocus(i: number, e: FocusEvent) {
  const firstEmpty = digits.value.findIndex((d) => !d);
  if (firstEmpty !== -1 && i > firstEmpty && !digits.value[i]) {
    focusCell(firstEmpty);
    return;
  }
  (e.target as HTMLInputElement).select();
}
function onPaste(i: number, e: ClipboardEvent) {
  e.preventDefault();
  fillFrom(i, e.clipboardData?.getData("text") ?? "");
}

watch(complete, async (ok) => {
  if (!ok || !import.meta.client) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  await nextTick();
  animate(cells.value, {
    scale: [
      { to: 1.15, duration: 140 },
      { to: 1, duration: 260 },
    ],
    delay: stagger(35),
    ease: "outQuad",
  });
});

function clear() {
  digits.value = Array(props.length).fill("");
  model.value = "";
  focusCell(0);
}
onMounted(() => props.autofocus && focusCell(0));
defineExpose({ clear, focus: () => focusCell(0) });
</script>

<template>
  <div class="flex gap-2" role="group" :aria-label="`${length}-digit code`">
    <input
      v-for="(d, i) in digits"
      :key="i"
      ref="cells"
      :value="d"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :autocomplete="i === 0 ? 'one-time-code' : 'off'"
      maxlength="6"
      :disabled="disabled"
      :aria-label="`Digit ${i + 1}`"
      class="h-14 w-0 min-w-0 flex-1 rounded-lg border text-center font-mono text-2xl font-bold tabular-nums transition-colors outline-none focus:border-blood focus:ring-2 focus:ring-blood/30 disabled:opacity-60"
      :class="
        error
          ? 'border-blood bg-blood-dim text-blood-text'
          : complete
            ? 'border-blood bg-blood text-white'
            : d
              ? 'border-line-strong bg-raised text-fg'
              : 'border-line-strong bg-surface-2 text-fg'
      "
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
      @focus="onFocus(i, $event)"
    />
  </div>
</template>
