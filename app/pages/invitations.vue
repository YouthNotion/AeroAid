<script setup lang="ts">
useHead({ title: "Invitations" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const {
  data: invitations,
  status,
  error,
  refresh,
} = await useAsyncData(
  "invitations",
  async () => {
    if (!user.value) return [];
    const { data, error } = await supabase
      .from("donations")
      .select(
        "id, patient_name, hospital, location, reference, date, status, created_at, requester:profiles!requester_id (id, full_name, contact, blood_group, area_name, avatar_url, updated_at)",
      )
      .eq("donor_id", user.value.sub)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  { watch: [() => user.value?.sub], default: () => [] },
);

const busyId = ref<number | null>(null);
async function respond(id: number, next: "completed" | "declined") {
  const msg =
    next === "completed"
      ? "Mark this request as donated?"
      : "Decline this request?";
  if (!confirm(msg)) return;
  busyId.value = id;
  const { data, error: err } = await supabase
    .from("donations")
    .update({ status: next })
    .eq("id", id)
    .select("id");
  busyId.value = null;
  if (err) return toast.error(`Couldn't update: ${err.message}`);
  if (!data?.length)
    return toast.error("Couldn't update this request (permission denied).");
  toast.success(
    next === "completed"
      ? "Thank you for donating! Added to your history."
      : "Request declined.",
  );
  clearNuxtData("my-history");
  await refresh();
}
</script>

<template>
  <div class="mx-auto max-w-xl lg:max-w-none">
    <PageHeader
      title="Invitations"
      :count="invitations.length"
      subtitle="People who've asked you to donate."
    />

    <StateMessage v-if="status === 'pending'" kind="loading" />
    <StateMessage v-else-if="error" kind="error" :text="error.message" />
    <StateMessage
      v-else-if="!invitations.length"
      kind="empty"
      text="No one has requested you right now."
    />
    <div v-else class="grid gap-4 lg:grid-cols-2 lg:items-start">
      <DonationCard
        v-for="inv in invitations"
        :key="inv.id"
        :donation="inv"
        :person="inv.requester"
        person-label="Requested by"
      >
        <template #actions>
          <button
            class="btn-ghost px-3 py-1.5 text-xs"
            :disabled="busyId === inv.id"
            @click="respond(inv.id, 'declined')"
          >
            Decline
          </button>
          <button
            class="btn-primary px-3 py-1.5 text-xs"
            :disabled="busyId === inv.id"
            @click="respond(inv.id, 'completed')"
          >
            Mark donated
          </button>
        </template>
      </DonationCard>
    </div>
  </div>
</template>
