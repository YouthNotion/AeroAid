<script setup lang="ts">
type Person = {
  id: string;
  full_name: string | null;
  blood_group: string | null;
  area_name: string | null;
  contact: string | null;
  avatar_url: string | null;
  updated_at?: string | null;
};

defineProps<{
  donation: {
    patient_name: string | null;
    hospital: string | null;
    location: string | null;
    reference: string | null;
    date: string | null;
    status: string | null;
  };
  person?: Person | null;
  personLabel?: string;
}>();

const statusStyle: Record<string, string> = {
  pending: "bg-amber-950 text-amber-300",
  completed: "bg-green-950 text-green-400",
  declined: "bg-raised text-soft",
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <article class="card">
    <div v-if="person" class="flex items-center gap-3 border-b border-line p-4">
      <AvatarImage
        :path="person.avatar_url"
        :version="person.updated_at"
        :alt="person.full_name ?? ''"
        :size="52"
      />
      <div class="min-w-0 flex-1">
        <p v-if="personLabel" class="label-caps">{{ personLabel }}</p>
        <NuxtLink
          :to="`/profile/${person.id}`"
          class="block truncate font-semibold hover:underline"
        >
          {{ person.full_name || "Unnamed" }}
        </NuxtLink>
        <p class="text-sm text-muted">
          {{ person.area_name || "Area not set" }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-1">
        <BloodBadge :group="person.blood_group" />
        <a
          v-if="person.contact"
          :href="`tel:${person.contact}`"
          class="text-sm font-semibold text-blood-text hover:underline"
        >
          {{ person.contact }}
        </a>
      </div>
    </div>

    <dl
      class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 bg-surface-2 p-4 text-sm"
    >
      <dt class="label-caps self-center">Patient</dt>
      <dd>{{ donation.patient_name || "—" }}</dd>
      <dt class="label-caps self-center">Hospital</dt>
      <dd>{{ donation.hospital || "—" }}</dd>
      <dt class="label-caps self-center">Location</dt>
      <dd>{{ donation.location || "—" }}</dd>
      <dt class="label-caps self-center">Date</dt>
      <dd>{{ fmt(donation.date) }}</dd>
      <template v-if="donation.reference">
        <dt class="label-caps self-center">Reference</dt>
        <dd>{{ donation.reference }}</dd>
      </template>
    </dl>

    <div
      class="flex items-center justify-between gap-2 border-t border-line px-4 py-3"
    >
      <span
        class="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
        :class="statusStyle[donation.status ?? ''] ?? 'bg-surface-2 text-muted'"
      >
        {{ donation.status || "unknown" }}
      </span>
      <div class="flex gap-2"><slot name="actions" /></div>
    </div>
  </article>
</template>
