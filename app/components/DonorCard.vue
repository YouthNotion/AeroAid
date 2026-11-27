<script setup lang="ts">
import type { Profile } from "~/types/database.types";

/** What anyone (even logged out) may read; contact, DOB and bio need a login. */
export type PublicDonor = Pick<
  Profile,
  | "id"
  | "full_name"
  | "blood_group"
  | "area_name"
  | "avatar_url"
  | "is_available"
  | "organization"
  | "updated_at"
>;

defineProps<{ donor: PublicDonor; canRequest: boolean }>();
const emit = defineEmits<{ request: [PublicDonor] }>();
</script>

<template>
  <article
    class="card relative flex items-center gap-4 p-4 transition lg:flex-col lg:items-stretch lg:gap-0 lg:p-0 lg:hover:border-line-strong"
  >
    <!-- Mobile: compact row. Desktop: vertical profile tile. -->
    <BloodBadge
      :group="donor.blood_group"
      class="absolute top-3 right-3 hidden lg:inline-flex"
    />

    <NuxtLink
      :to="`/profile/${donor.id}`"
      class="shrink-0 lg:flex lg:justify-center lg:bg-gradient-to-b lg:from-surface-2 lg:to-surface lg:pt-7 lg:pb-3"
      :aria-label="`View ${donor.full_name ?? 'donor'}'s profile`"
    >
      <AvatarImage
        :path="donor.avatar_url"
        :version="donor.updated_at"
        :alt="donor.full_name ?? ''"
        :size="64"
        class="lg:hidden"
      />
      <AvatarImage
        :path="donor.avatar_url"
        :version="donor.updated_at"
        :alt="donor.full_name ?? ''"
        :size="88"
        class="hidden lg:block"
      />
    </NuxtLink>

    <div class="min-w-0 flex-1 lg:px-4 lg:text-center">
      <div class="flex items-center gap-2 lg:justify-center">
        <h3 class="truncate font-semibold">
          {{ donor.full_name || "Unnamed donor" }}
        </h3>
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :class="donor.is_available ? 'bg-green-500' : 'bg-line-strong'"
          :title="donor.is_available ? 'Available' : 'Not available right now'"
        />
      </div>
      <p class="truncate text-sm text-muted">
        {{ donor.area_name || "Area not set"
        }}<template v-if="donor.organization">
          · {{ donor.organization }}</template
        >
      </p>
      <p
        class="mt-0.5 text-xs"
        :class="donor.is_available ? 'text-green-400' : 'text-muted'"
      >
        {{
          donor.is_available ? "Available to donate" : "Not available right now"
        }}
      </p>
    </div>

    <div
      class="flex flex-col items-end gap-2 lg:mt-4 lg:border-t lg:border-line lg:p-3"
    >
      <BloodBadge :group="donor.blood_group" class="lg:hidden" />
      <button
        v-if="canRequest"
        class="btn-primary px-3 py-1.5 text-xs lg:w-full lg:py-2 lg:text-sm"
        :disabled="!donor.is_available"
        @click="emit('request', donor)"
      >
        Request
      </button>
      <NuxtLink
        v-else
        to="/login"
        class="text-xs font-semibold text-blood-text hover:underline lg:w-full lg:py-1.5 lg:text-center lg:text-sm"
      >
        Log in to request
      </NuxtLink>
    </div>
  </article>
</template>
