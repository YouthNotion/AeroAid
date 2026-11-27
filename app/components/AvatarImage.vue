<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    path?: string | null;
    version?: string | null;
    alt?: string;
    size?: number;
  }>(),
  { path: null, version: null, alt: "", size: 72 },
);

const supabase = useSupabaseClient();
const failed = ref(false);
watch(
  () => [props.path, props.version],
  () => (failed.value = false),
);

const src = computed(() => {
  if (!props.path) return null;
  if (/^https?:\/\//.test(props.path)) return props.path;
  const url = supabase.storage.from("avatars").getPublicUrl(props.path)
    .data.publicUrl;
  // Avatars are upserted at the same path, so bust the CDN cache when the profile changes.
  return props.version ? `${url}?v=${encodeURIComponent(props.version)}` : url;
});
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :width="size"
    :height="size"
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="shrink-0 rounded-full border border-line bg-raised object-cover"
    loading="lazy"
    @error="failed = true"
  />
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    role="img"
    :aria-label="alt || 'No photo'"
    class="shrink-0 rounded-full border border-line bg-raised"
  >
    <!-- No photo: neutral dark silhouette. (Comment lives inside the svg: a comment
         beside the root would make this a fragment and drop the parent's classes.) -->
    <circle cx="32" cy="25" r="11" fill="#3a3a3a" />
    <path d="M10 58c2-12 11-18 22-18s20 6 22 18" fill="#3a3a3a" />
  </svg>
</template>
