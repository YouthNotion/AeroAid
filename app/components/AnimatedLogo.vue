<script setup lang="ts">
import {
  createDrawable,
  createTimeline,
  set,
  stagger,
  type Timeline,
} from "animejs";

/**
 * The AeroAid logo as inline SVG, animated with anime.js.
 *  - intro:  disc springs in, triangle draws itself, cross pops, wordmark flickers on like a cockpit display
 *  - motion: 'heartbeat' = cross beats with a radar-style ping, forever
 *            'hover'     = one heartbeat when hovered
 *            'none'      = static after the intro
 * Honors prefers-reduced-motion (renders static).
 */
const props = withDefaults(
  defineProps<{
    variant?: "mark" | "full";
    size?: number;
    intro?: boolean;
    motion?: "heartbeat" | "hover" | "none";
    label?: string;
  }>(),
  { variant: "mark", size: 40, intro: false, motion: "none", label: "AeroAid" },
);

// Wordmark traced pixel-for-pixel from the original logo, one path per letter (A E R O A I D).
const LETTERS = [
  "M56 152h4v1h-4zM55 153h6v1h-6zM55 154h2v1h-2zM59 154h2v1h-2zM54 155h3v1h-3zM59 155h3v1h-3zM54 156h3v1h-3zM59 156h3v1h-3zM54 157h2v1h-2zM60 157h2v1h-2zM53 158h3v1h-3zM60 158h3v1h-3zM53 159h10v1h-10zM53 160h10v1h-10zM53 161h3v1h-3zM60 161h3v1h-3zM53 162h3v1h-3zM61 162h2v1h-2zM53 163h3v1h-3zM61 163h2v1h-2z",
  "M66 152h9v1h-9zM66 153h9v1h-9zM66 154h2v1h-2zM66 155h2v1h-2zM66 156h3v1h-3zM66 157h9v1h-9zM66 158h9v1h-9zM66 159h2v1h-2zM66 160h2v1h-2zM66 161h3v1h-3zM66 162h9v1h-9zM66 163h9v1h-9z",
  "M78 152h9v1h-9zM78 153h10v1h-10zM78 154h3v1h-3zM86 154h2v1h-2zM78 155h3v1h-3zM86 155h2v1h-2zM78 156h3v1h-3zM85 156h3v1h-3zM78 157h10v1h-10zM78 158h9v1h-9zM78 159h3v1h-3zM84 159h2v1h-2zM78 160h3v1h-3zM84 160h3v1h-3zM78 161h3v1h-3zM84 161h3v1h-3zM78 162h3v1h-3zM85 162h3v1h-3zM78 163h3v1h-3zM85 163h3v1h-3z",
  "M92 152h8v1h-8zM91 153h10v1h-10zM91 154h3v1h-3zM98 154h3v1h-3zM91 155h2v1h-2zM98 155h3v1h-3zM91 156h2v1h-2zM98 156h3v1h-3zM91 157h2v1h-2zM98 157h3v1h-3zM91 158h2v1h-2zM98 158h3v1h-3zM91 159h2v1h-2zM98 159h3v1h-3zM91 160h2v1h-2zM98 160h3v1h-3zM91 161h3v1h-3zM98 161h3v1h-3zM92 162h8v1h-8zM93 163h6v1h-6z",
  "M106 152h5v1h-5zM106 153h5v1h-5zM105 154h3v1h-3zM109 154h3v1h-3zM105 155h3v1h-3zM110 155h2v1h-2zM105 156h2v1h-2zM110 156h3v1h-3zM104 157h3v1h-3zM110 157h3v1h-3zM104 158h2v1h-2zM111 158h2v1h-2zM104 159h10v1h-10zM104 160h10v1h-10zM104 161h3v1h-3zM111 161h3v1h-3zM104 162h2v1h-2zM111 162h3v1h-3zM104 163h2v1h-2zM111 163h2v1h-2z",
  "M117 152h9v1h-9zM117 153h9v1h-9zM120 154h3v1h-3zM120 155h3v1h-3zM120 156h3v1h-3zM120 157h3v1h-3zM120 158h3v1h-3zM120 159h3v1h-3zM120 160h3v1h-3zM120 161h3v1h-3zM117 162h9v1h-9zM117 163h9v1h-9z",
  "M129 152h9v1h-9zM129 153h10v1h-10zM129 154h2v1h-2zM136 154h3v1h-3zM129 155h2v1h-2zM136 155h3v1h-3zM129 156h2v1h-2zM136 156h3v1h-3zM129 157h2v1h-2zM136 157h3v1h-3zM129 158h2v1h-2zM136 158h3v1h-3zM129 159h2v1h-2zM136 159h3v1h-3zM129 160h2v1h-2zM136 160h3v1h-3zM129 161h3v1h-3zM136 161h3v1h-3zM129 162h9v1h-9zM129 163h8v1h-8z",
];
const TRIANGLE = "M95.5 49 132.4 113H58.6Z";
const CROSS = "M90 69h12v12h12v12h-12v12H90V93H78V81h12Z";

const viewBox = computed(() =>
  props.variant === "full" ? "38.5 29.5 114 137" : "40.5 31.5 110 110",
);
const height = computed(() =>
  props.variant === "full" ? Math.round((props.size * 137) / 114) : props.size,
);

const ring = ref<SVGCircleElement>();
const disc = ref<SVGCircleElement>();
const triOutline = ref<SVGPathElement>();
const triFill = ref<SVGPathElement>();
const cross = ref<SVGPathElement>();
const letters = ref<SVGPathElement[]>([]);

// Hide the parts that animate in until the intro is set up, so there's no flash of the final logo.
const hidden = ref(props.intro);
let intro: Timeline | null = null;
let beat: Timeline | null = null;

function heartbeat(loop: boolean) {
  return createTimeline({ loop, loopDelay: 1500, autoplay: true })
    .add(cross.value!, {
      scale: [
        { to: 1.2, duration: 140 },
        { to: 1, duration: 220 },
      ],
      ease: "outQuad",
    })
    .add(
      cross.value!,
      {
        scale: [
          { to: 1.1, duration: 120 },
          { to: 1, duration: 260 },
        ],
        ease: "outQuad",
      },
      "+=70",
    )
    .add(
      ring.value!,
      {
        scale: [1, 1.45],
        opacity: [0.55, 0],
        duration: 1300,
        ease: "outCubic",
      },
      0,
    );
}

function onHover() {
  if (props.motion !== "hover" || (beat && !beat.completed)) return;
  beat?.revert();
  beat = heartbeat(false);
}

onMounted(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    hidden.value = false;
    return;
  }

  if (props.intro) {
    set(disc.value!, { scale: 0 });
    set(triFill.value!, { opacity: 0 });
    set(cross.value!, { scale: 0 });
    if (letters.value.length) set(letters.value, { opacity: 0 });
    hidden.value = false;

    intro = createTimeline({ defaults: { ease: "outExpo" } })
      .add(disc.value!, { scale: [0, 1], duration: 700, ease: "outBack(1.4)" })
      .add(
        createDrawable(triOutline.value!),
        { draw: ["0 0", "0 1"], duration: 650, ease: "inOutSine" },
        "-=250",
      )
      .add(triFill.value!, { opacity: [0, 1], duration: 250 }, "-=100")
      .add(
        cross.value!,
        { scale: [0, 1], duration: 600, ease: "outElastic(1, .55)" },
        "-=150",
      );
    // Only the 'full' variant has a wordmark to flicker on.
    if (letters.value.length) {
      intro.add(
        letters.value,
        {
          opacity: [
            { to: 1, duration: 40 },
            { to: 0.15, duration: 50 },
            { to: 1, duration: 60 },
          ],
          delay: stagger(70),
          ease: "linear",
        },
        "-=400",
      );
    }
    intro.call(() => {
      if (props.motion === "heartbeat") beat = heartbeat(true);
    });
  } else if (props.motion === "heartbeat") {
    beat = heartbeat(true);
  }
});

onBeforeUnmount(() => {
  intro?.revert();
  beat?.revert();
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    :width="size"
    :height="height"
    role="img"
    :aria-label="label"
    class="aeroaid-logo overflow-visible"
    @mouseenter="onHover"
  >
    <circle
      ref="ring"
      cx="95.5"
      cy="86.5"
      r="55"
      fill="none"
      stroke="#D40001"
      stroke-width="3"
      opacity="0"
    />
    <g :style="{ visibility: hidden ? 'hidden' : 'visible' }">
      <circle ref="disc" cx="95.5" cy="86.5" r="55" fill="#D40001" />
      <path
        ref="triOutline"
        :d="TRIANGLE"
        fill="none"
        stroke="#fff"
        stroke-width="8"
        stroke-linejoin="round"
      />
      <path
        ref="triFill"
        :d="TRIANGLE"
        fill="#fff"
        stroke="#fff"
        stroke-width="8"
        stroke-linejoin="round"
      />
      <path ref="cross" :d="CROSS" fill="#D40001" />
      <g v-if="variant === 'full'" fill="currentColor">
        <path v-for="(d, i) in LETTERS" :key="i" ref="letters" :d="d" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.aeroaid-logo circle,
.aeroaid-logo path {
  transform-box: fill-box;
  transform-origin: center;
}
</style>
