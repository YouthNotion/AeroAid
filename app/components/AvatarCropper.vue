<script setup lang="ts">
/**
 * Square avatar cropper with a circular guide.
 * Drag to pan; zoom with the slider, +/- buttons, mouse wheel or pinch; rotate in 90° steps.
 * Emits a 512×512 JPEG of exactly what's inside the square.
 */
const props = defineProps<{ file: File }>();
const emit = defineEmits<{ cancel: []; confirm: [Blob] }>();

const OUTPUT = 512;
const MAX_ZOOM = 4;

const stage = ref<HTMLDivElement>();
const stageSize = ref(320);
const img = ref<HTMLImageElement | null>(null);
const natural = reactive({ w: 0, h: 0 });
const loadError = ref("");

const zoom = ref(1); // 1 = image just covers the square
const rotation = ref(0); // degrees: 0, 90, 180, 270
const offset = reactive({ x: 0, y: 0 }); // image centre relative to stage centre, in screen px

const url = URL.createObjectURL(props.file);
onBeforeUnmount(() => URL.revokeObjectURL(url));

// Image dimensions as displayed, accounting for rotation.
const rotated = computed(() =>
  rotation.value % 180 === 0
    ? { w: natural.w, h: natural.h }
    : { w: natural.h, h: natural.w },
);
const baseScale = computed(() =>
  natural.w
    ? Math.max(
        stageSize.value / rotated.value.w,
        stageSize.value / rotated.value.h,
      )
    : 1,
);
const scale = computed(() => baseScale.value * zoom.value);

function clamp() {
  const maxX = Math.max(
    0,
    (rotated.value.w * scale.value - stageSize.value) / 2,
  );
  const maxY = Math.max(
    0,
    (rotated.value.h * scale.value - stageSize.value) / 2,
  );
  offset.x = Math.min(maxX, Math.max(-maxX, offset.x));
  offset.y = Math.min(maxY, Math.max(-maxY, offset.y));
}

/** Zoom to `next`, keeping the point (px, py) — relative to the stage centre — fixed on screen. */
function setZoom(next: number, px = 0, py = 0) {
  const z = Math.min(MAX_ZOOM, Math.max(1, next));
  const ratio = z / zoom.value;
  offset.x = px - (px - offset.x) * ratio;
  offset.y = py - (py - offset.y) * ratio;
  zoom.value = z;
  clamp();
}

function rotate() {
  rotation.value = (rotation.value + 90) % 360;
  clamp();
}
function reset() {
  zoom.value = 1;
  rotation.value = 0;
  offset.x = offset.y = 0;
}

// Pointer handling: one pointer pans, two pointers pinch-zoom.
const pointers = new Map<number, { x: number; y: number }>();
let pinchStart = 0;
let zoomAtPinchStart = 1;

function localPoint(e: { clientX: number; clientY: number }) {
  const r = stage.value!.getBoundingClientRect();
  return {
    x: e.clientX - r.left - r.width / 2,
    y: e.clientY - r.top - r.height / 2,
  };
}
function onPointerDown(e: PointerEvent) {
  stage.value!.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    zoomAtPinchStart = zoom.value;
  }
}
function onPointerMove(e: PointerEvent) {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const cur = { x: e.clientX, y: e.clientY };
  pointers.set(e.pointerId, cur);
  if (pointers.size === 1) {
    offset.x += cur.x - prev.x;
    offset.y += cur.y - prev.y;
    clamp();
  } else if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    const mid = localPoint({
      clientX: (a!.x + b!.x) / 2,
      clientY: (a!.y + b!.y) / 2,
    });
    setZoom(zoomAtPinchStart * (dist / pinchStart), mid.x, mid.y);
  }
}
function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = 0;
}
function onWheel(e: WheelEvent) {
  const p = localPoint(e);
  setZoom(zoom.value * Math.exp(-e.deltaY * 0.0015), p.x, p.y);
}
function onKey(e: KeyboardEvent) {
  const step = e.shiftKey ? 20 : 5;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [step, 0],
    ArrowRight: [-step, 0],
    ArrowUp: [0, step],
    ArrowDown: [0, -step],
  };
  if (moves[e.key]) {
    offset.x += moves[e.key]![0];
    offset.y += moves[e.key]![1];
    clamp();
  } else if (e.key === "+" || e.key === "=") setZoom(zoom.value * 1.1);
  else if (e.key === "-") setZoom(zoom.value / 1.1);
  else return;
  e.preventDefault();
}

function measure() {
  if (stage.value) stageSize.value = stage.value.clientWidth;
  clamp();
}
let ro: ResizeObserver | null = null;
onMounted(() => {
  measure();
  ro = new ResizeObserver(measure);
  ro.observe(stage.value!);
  const el = new Image();
  el.onload = () => {
    natural.w = el.naturalWidth;
    natural.h = el.naturalHeight;
    img.value = el;
  };
  el.onerror = () =>
    (loadError.value = "This image couldn't be opened. Try a JPG or PNG.");
  el.src = url;
});
onBeforeUnmount(() => ro?.disconnect());

const imgStyle = computed(() => ({
  width: `${natural.w}px`,
  height: `${natural.h}px`,
  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation.value}deg) scale(${scale.value})`,
}));

const saving = ref(false);
async function confirm() {
  if (!img.value) return;
  saving.value = true;
  const k = OUTPUT / stageSize.value;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, OUTPUT, OUTPUT);
  // Same transform as the on-screen preview, scaled up to the output size.
  ctx.translate(OUTPUT / 2 + offset.x * k, OUTPUT / 2 + offset.y * k);
  ctx.rotate((rotation.value * Math.PI) / 180);
  ctx.scale(scale.value * k, scale.value * k);
  ctx.drawImage(img.value, -natural.w / 2, -natural.h / 2);
  canvas.toBlob(
    (blob) => {
      saving.value = false;
      if (blob) emit("confirm", blob);
    },
    "image/jpeg",
    0.9,
  );
}
</script>

<template>
  <div class="space-y-4">
    <div
      ref="stage"
      class="relative mx-auto aspect-square w-full max-w-[360px] cursor-grab touch-none overflow-hidden rounded-xl bg-raised select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-blood"
      tabindex="0"
      aria-label="Photo crop area. Drag or use arrow keys to move; plus and minus to zoom."
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel.prevent="onWheel"
      @keydown="onKey"
    >
      <img
        v-if="img"
        :src="url"
        alt=""
        draggable="false"
        class="pointer-events-none absolute top-1/2 left-1/2 max-w-none origin-center"
        :style="imgStyle"
      />
      <StateMessage
        v-else-if="!loadError"
        kind="loading"
        class="absolute inset-0"
      />
      <p
        v-else
        class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-blood-text"
      >
        {{ loadError }}
      </p>

      <!-- Circular guide: dim everything outside the avatar circle -->
      <div
        class="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] ring-2 ring-white/80"
      />
    </div>

    <div class="mx-auto flex max-w-[360px] items-center gap-3">
      <button
        type="button"
        class="btn-ghost h-9 w-9 !p-0 text-lg"
        aria-label="Zoom out"
        @click="setZoom(zoom / 1.2)"
      >
        −
      </button>
      <input
        :value="zoom"
        type="range"
        min="1"
        :max="MAX_ZOOM"
        step="0.01"
        class="h-1.5 flex-1 cursor-pointer accent-[var(--color-blood)]"
        aria-label="Zoom"
        @input="setZoom(Number(($event.target as HTMLInputElement).value))"
      />
      <button
        type="button"
        class="btn-ghost h-9 w-9 !p-0 text-lg"
        aria-label="Zoom in"
        @click="setZoom(zoom * 1.2)"
      >
        +
      </button>
    </div>

    <div class="mx-auto flex max-w-[360px] justify-center gap-2">
      <button
        type="button"
        class="btn-ghost px-3 py-1.5 text-xs"
        @click="rotate"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        Rotate
      </button>
      <button
        type="button"
        class="btn-ghost px-3 py-1.5 text-xs"
        @click="reset"
      >
        Reset
      </button>
    </div>

    <p class="text-center text-xs text-muted">
      Drag to reposition. Pinch, scroll or use the slider to zoom.
    </p>

    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">
        Cancel
      </button>
      <button
        type="button"
        class="btn-primary flex-1"
        :disabled="!img || saving"
        @click="confirm"
      >
        {{ saving ? "Saving…" : "Use photo" }}
      </button>
    </div>
  </div>
</template>
