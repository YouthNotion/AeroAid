<script setup lang="ts">
import type { DonationFormData } from "~/components/DonationForm.vue";

useHead({ title: "My donations" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const {
  data: history,
  status,
  error,
  refresh,
} = await useAsyncData(
  "my-history",
  async () => {
    if (!user.value) return [];
    const { data, error } = await supabase
      .from("donations")
      .select("id, patient_name, hospital, location, reference, date, status")
      .eq("donor_id", user.value.sub)
      .eq("status", "completed")
      .order("date", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data;
  },
  { watch: [() => user.value?.sub], default: () => [] },
);

const daysSinceLast = computed(() => {
  const last = history.value.find((h) => h.date)?.date;
  if (!last) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000),
  );
});

const adding = ref(false);
const saving = ref(false);
async function addDonation(form: DonationFormData) {
  if (!user.value) return;
  saving.value = true;
  const { error: err } = await supabase.from("donations").insert({
    donor_id: user.value.sub,
    status: "completed",
    patient_name: form.patient_name,
    hospital: form.hospital,
    location: form.location || null,
    reference: form.reference || null,
    date: form.date,
  });
  saving.value = false;
  if (err) return toast.error(`Couldn't save: ${err.message}`);
  toast.success("Donation logged.");
  adding.value = false;
  await refresh();
}
</script>

<template>
  <div class="mx-auto max-w-xl lg:max-w-none">
    <PageHeader title="My donations" :count="history.length" />

    <div class="lg:grid lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-8">
      <aside
        class="mb-6 flex items-center justify-between gap-4 rounded-xl border border-blood-line bg-gradient-to-br from-blood-dim to-surface p-4 lg:sticky lg:top-24 lg:mb-0 lg:flex-col lg:items-stretch lg:gap-5 lg:p-6"
      >
        <div>
          <p class="text-xs tracking-widest text-subtle uppercase">
            Last donation
          </p>
          <p class="font-digital text-3xl text-blood-text lg:text-5xl">
            <template v-if="daysSinceLast !== null"
              >{{ daysSinceLast }}
              <span class="text-lg lg:text-2xl">days ago</span></template
            >
            <template v-else>--</template>
          </p>
        </div>
        <div class="hidden border-t border-blood-line pt-5 lg:block">
          <p class="text-xs tracking-widest text-subtle uppercase">
            Total donations
          </p>
          <p class="font-digital text-5xl text-fg">
            {{ String(history.length).padStart(2, "0") }}
          </p>
        </div>
        <button class="btn-primary" @click="adding = true">
          + Log donation
        </button>
      </aside>

      <section>
        <StateMessage v-if="status === 'pending'" kind="loading" />
        <StateMessage v-else-if="error" kind="error" :text="error.message" />
        <StateMessage
          v-else-if="!history.length"
          kind="empty"
          text="No donations logged yet."
        />
        <div v-else class="grid gap-4 xl:grid-cols-2 xl:items-start">
          <DonationCard v-for="h in history" :key="h.id" :donation="h" />
        </div>
      </section>
    </div>

    <ModalSheet v-if="adding" title="Log a donation" @close="adding = false">
      <DonationForm
        submit-label="Save donation"
        :busy="saving"
        @submit="addDonation"
        @cancel="adding = false"
      />
    </ModalSheet>
  </div>
</template>
