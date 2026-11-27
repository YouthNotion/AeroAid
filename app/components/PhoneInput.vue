<script setup lang="ts">
import { animate, stagger } from "animejs";

/**
 * Bangladeshi mobile number as 11 single-digit boxes (01X-XXXXXXXX).
 * Typing advances, Backspace goes back, arrows move, paste/autofill fills every box
 * (a +880 / 880 prefix is stripped). When all 11 digits form a valid number the boxes
 * pulse red and a confirmation appears. v-model is the digit string, e.g. '01712345678'.
 */
const props = withDefaults(
  defineProps<{ label?: string; required?: boolean }>(),
  { label: "Mobile number", required: false },
);
const model = defineModel<string>({ default: "" });

const LENGTH = 11;
const boxes = ref<HTMLInputElement[]>([]);
const digits = ref<string[]>(Array(LENGTH).fill(""));

/** Keep digits only; turn +8801… / 8801… into 01…; cap at 11. */
function normalize(raw: string) {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("880")) d = d.slice(2);
  return d.slice(0, LENGTH);
}

watch(
  model,
  (v) => {
    const d = normalize(v);
    if (d !== digits.value.join(""))
      digits.value = Array.from({ length: LENGTH }, (_, i) => d[i] ?? "");
    // Hand a cleaned-up value back, e.g. a saved "+880 1712-345678" → "01712345678".
    if (v && d !== v) model.value = d;
  },
  { immediate: true },
);

const value = computed(() => digits.value.join(""));
const complete = computed(
  () => value.value.length === LENGTH && digits.value.every(Boolean),
);
const valid = computed(
  () => complete.value && /^01[3-9]\d{8}$/.test(value.value),
);

function emitValue() {
  model.value = digits.value.join("");
}
function focusBox(i: number) {
  const el = boxes.value[Math.max(0, Math.min(LENGTH - 1, i))];
  el?.focus();
  el?.select();
}

/** Write a run of digits starting at box i (used by typing, paste and autofill). */
function fillFrom(i: number, text: string) {
  const d = normalize(text);
  if (!d) return;
  // A whole number pasted anywhere fills from the start.
  const start = d.length >= LENGTH ? 0 : i;
  for (let k = 0; k < d.length && start + k < LENGTH; k++)
    digits.value[start + k] = d[k]!;
  emitValue();
  focusBox(Math.min(start + d.length, LENGTH - 1));
}

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement;
  const typed = el.value;
  el.value = digits.value[i] ?? ""; // the model drives the box contents
  if (!typed) {
    digits.value[i] = "";
    emitValue();
    return;
  }
  // Single new digit: replace this box's digit with the one just typed.
  const newest = typed.replace(digits.value[i] ?? "", "") || typed;
  fillFrom(i, newest.length > 1 ? typed : newest);
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace") {
    e.preventDefault();
    if (digits.value[i]) {
      digits.value[i] = "";
    } else if (i > 0) {
      digits.value[i - 1] = "";
      focusBox(i - 1);
    }
    emitValue();
  } else if (e.key === "Delete") {
    e.preventDefault();
    digits.value[i] = "";
    emitValue();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    focusBox(i - 1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    focusBox(i + 1);
  } else if (e.key === "Home") {
    e.preventDefault();
    focusBox(0);
  } else if (e.key === "End") {
    e.preventDefault();
    focusBox(LENGTH - 1);
  } else if (
    e.key.length === 1 &&
    !/\d/.test(e.key) &&
    !e.ctrlKey &&
    !e.metaKey
  ) {
    e.preventDefault(); // ignore letters/symbols
  }
}

/**
 * Digits always fill from the left: focusing an empty cell past the first gap
 * (e.g. clicking the middle of an empty field) jumps to the first empty cell.
 * Cells that already hold a digit stay reachable for corrections.
 */
function onFocus(i: number, e: FocusEvent) {
  const firstEmpty = digits.value.findIndex((d) => !d);
  if (firstEmpty !== -1 && i > firstEmpty && !digits.value[i]) {
    focusBox(firstEmpty);
    return;
  }
  (e.target as HTMLInputElement).select();
}

function onPaste(i: number, e: ClipboardEvent) {
  e.preventDefault();
  fillFrom(i, e.clipboardData?.getData("text") ?? "");
}

// Celebrate a complete, valid number: boxes pulse red one after another.
watch(valid, async (ok) => {
  if (!ok || !import.meta.client) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  await nextTick();
  animate(boxes.value, {
    scale: [
      { to: 1.18, duration: 140 },
      { to: 1, duration: 260 },
    ],
    delay: stagger(28),
    ease: "outQuad",
  });
});

// Faint example digits in empty cells, so people see the expected shape.
const EXAMPLE = "01712345678";

defineExpose({ valid, complete });
</script>

<template>
  <div>
    <!-- One field with 11 digit cells: 01712 – 345678 -->
    <div
      class="flex h-12 items-center gap-0.5 rounded-lg border px-1.5 transition-colors focus-within:ring-2 sm:gap-1"
      :class="
        valid
          ? 'border-blood bg-blood-dim focus-within:ring-blood/30'
          : complete
            ? 'border-amber-700 bg-amber-950/40 focus-within:ring-amber-700/30'
            : 'border-line-strong bg-surface-2 focus-within:border-blood focus-within:ring-blood/30'
      "
      role="group"
      :aria-label="`${props.label}, 11 digits`"
    >
      <template v-for="(d, i) in digits" :key="i">
        <span
          v-if="i === 5"
          class="shrink-0 px-0.5 text-subtle select-none"
          aria-hidden="true"
          >–</span
        >
        <input
          ref="boxes"
          :value="d"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          :autocomplete="i === 0 ? 'tel-national' : 'off'"
          maxlength="11"
          :required="props.required"
          :placeholder="EXAMPLE[i]"
          :aria-label="`${props.label} digit ${i + 1}`"
          class="h-9 w-0 min-w-0 flex-1 rounded-md text-center font-mono text-base font-semibold tabular-nums transition-colors outline-none placeholder:text-line-strong focus:bg-raised focus:ring-1 focus:ring-blood sm:text-lg"
          :class="
            valid
              ? 'bg-blood text-white'
              : complete
                ? 'bg-amber-950 text-amber-200'
                : d
                  ? 'bg-raised text-fg'
                  : 'bg-transparent text-fg'
          "
          @input="onInput(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste(i, $event)"
          @focus="onFocus(i, $event)"
        />
      </template>
    </div>

    <p class="mt-1.5 min-h-4 text-xs" aria-live="polite">
      <span v-if="valid" class="font-semibold text-blood-text"
        >✓ All 11 digits in</span
      >
      <span v-else-if="complete" class="text-amber-300"
        >Bangladeshi mobile numbers start with 013–019.</span
      >
      <span v-else-if="value.length" class="text-muted"
        >{{ LENGTH - value.length }} more
        {{ LENGTH - value.length === 1 ? "digit" : "digits" }}</span
      >
      <span v-else class="text-muted">11 digits, e.g. 01712345678</span>
    </p>
  </div>
</template>
