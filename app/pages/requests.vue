<script setup lang="ts">
useHead({ title: "Sent requests" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const tab = ref<"pending" | "past">("pending");

const {
  data: requests,
  status,
  error,
  refresh,
} = await useAsyncData(
  "sent-requests",
  async () => {
    if (!user.value) return [];
    const { data, error } = await supabase
      .from("donations")
      .select(
        "id, patient_name, hospital, location, reference, date, status, created_at, donor:profiles!donor_id (id, full_name, contact, blood_group, area_name, avatar_url, updated_at)",
      )
      .eq("requester_id", user.value.sub)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  { watch: [() => user.value?.sub], default: () => [] },
);

const pending = computed(() =>
  requests.value.filter((r) => r.status === "pending"),
);
const past = computed(() =>
  requests.value.filter((r) => r.status !== "pending"),
);
const shown = computed(() =>
  tab.value === "pending" ? pending.value : past.value,
);

const busyId = ref<number | null>(null);
async function cancel(id: number) {
  if (!confirm("Cancel this request?")) return;
  busyId.value = id;
  const { error: err, count } = await supabase
    .from("donations")
    .delete({ count: "exact" })
    .eq("id", id);
  busyId.value = null;
  if (err) return toast.error(`Couldn't cancel: ${err.message}`);
  if (count === 0)
    return toast.error("Couldn't cancel this request (permission denied).");
  toast.success("Request cancelled.");
  clearNuxtData("donor-search");
  await refresh();
}
</script>

<template>
  <div class="mx-auto max-w-xl lg:max-w-none">
    <PageHeader
      title="Sent requests"
      :count="pending.length"
      subtitle="Donors you've asked to donate."
    />

    <div
      class="mb-4 inline-flex rounded-lg bg-raised p-1 text-sm font-semibold"
    >
      <button
        v-for="t in ['pending', 'past'] as const"
        :key="t"
        class="rounded-md px-4 py-1.5 capitalize"
        :class="tab === t ? 'bg-blood text-white' : 'text-muted hover:text-fg'"
        @click="tab = t"
      >
        {{ t }} ({{ t === "pending" ? pending.length : past.length }})
      </button>
    </div>

    <StateMessage v-if="status === 'pending'" kind="loading" />
    <StateMessage v-else-if="error" kind="error" :text="error.message" />
    <StateMessage
      v-else-if="!shown.length"
      kind="empty"
      :text="tab === 'pending' ? 'No open requests.' : 'No past requests.'"
    >
      <NuxtLink v-if="tab === 'pending'" to="/search" class="btn-primary"
        >Find a donor</NuxtLink
      >
    </StateMessage>
    <div v-else class="grid gap-4 lg:grid-cols-2 lg:items-start">
      <DonationCard
        v-for="r in shown"
        :key="r.id"
        :donation="r"
        :person="r.donor"
        person-label="Donor"
      >
        <template v-if="r.status === 'pending'" #actions>
          <button
            class="btn-ghost px-3 py-1.5 text-xs"
            :disabled="busyId === r.id"
            @click="cancel(r.id)"
          >
            Cancel request
          </button>
        </template>
      </DonationCard>
    </div>
  </div>
</template>
