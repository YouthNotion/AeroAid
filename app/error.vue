<script setup lang="ts">
import type { NuxtError } from "#app";

// Replaces Nuxt's default (white) error page so 404s and crashes stay on-theme.
const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error.statusCode === 404);
useHead({ title: notFound.value ? "Page not found" : "Something went wrong" });
</script>

<template>
  <NuxtLayout>
    <div class="flex flex-col items-center py-16 text-center">
      <AnimatedLogo :size="88" motion="heartbeat" class="mb-6" />
      <p class="font-digital text-6xl text-blood-text">
        {{ error.statusCode }}
      </p>
      <h1 class="mt-2 text-xl font-bold">
        {{ notFound ? "This page doesn't exist" : "Something went wrong" }}
      </h1>
      <p class="mt-2 max-w-sm text-sm text-muted">
        {{
          notFound
            ? "The link may be broken or the page was moved."
            : "Please try again in a moment."
        }}
      </p>
      <button class="btn-primary mt-6" @click="clearError({ redirect: '/' })">
        Back to home
      </button>
    </div>
  </NuxtLayout>
</template>
