<script setup lang="ts">
import type { Profile } from "~/types/database.types";
import type { DonationFormData } from "~/components/DonationForm.vue";

useHead({ title: "Find donors" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { data: me } = await useMyProfile();

const bloodGroup = computed(() => (route.query.bloodGroup as string) || "");
const area = computed(() => (route.query.area as string) || "");
const availableOnly = computed(() => route.query.available === "1");
const hasFilters = computed(
  () => !!(bloodGroup.value || area.value || availableOnly.value),
);

function setFilter(key: "bloodGroup" | "area" | "available", value: string) {
  const query = { ...route.query, [key]: value || undefined };
  router.replace({ query });
}
function clearFilters() {
  router.replace({ query: {} });
}

// Everyone is listed by default (available donors first); each filter narrows the list.
const {
  data: donors,
  status,
  error,
  refresh,
} = await useAsyncData(
  "donor-search",
  async () => {
    const uid = user.value?.sub;

    // Hide donors the current user already has a pending request with.
    let pendingIds: string[] = [];
    if (uid) {
      const { data } = await supabase
        .from("donations")
        .select("donor_id")
        .eq("requester_id", uid)
        .eq("status", "pending");
      pendingIds = (data ?? [])
        .map((d) => d.donor_id)
        .filter((id): id is string => !!id);
    }

    let q = supabase
      .from("profiles")
      .select("*")
      .order("is_available", { ascending: false })
      .order("full_name");
    if (bloodGroup.value)
      q = q.eq("blood_group", bloodGroup.value as BloodGroup);
    if (area.value) q = q.eq("area_name", area.value);
    if (availableOnly.value) q = q.eq("is_available", true);
    if (uid) q = q.neq("id", uid);
    if (pendingIds.length) q = q.not("id", "in", `(${pendingIds.join(",")})`);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  {
    watch: [bloodGroup, area, availableOnly, () => user.value?.sub],
    default: () => [] as Profile[],
  },
);

const availableCount = computed(
  () => donors.value?.filter((d) => d.is_available).length ?? 0,
);
const summary = computed(() => {
  const total = donors.value?.length ?? 0;
  const who = `${total} ${total === 1 ? "donor" : "donors"}`;
  const group = bloodGroup.value ? ` with ${bloodGroup.value}` : "";
  const where = area.value ? ` in ${area.value}` : "";
  return availableOnly.value
    ? `${who}${group}${where}, all available`
    : `${who}${group}${where}, ${availableCount.value} available`;
});

// Request flow
const target = ref<Profile | null>(null);
const sending = ref(false);

async function sendRequest(form: DonationFormData) {
  if (!target.value || !user.value) return;
  sending.value = true;
  const { error: err } = await supabase.from("donations").insert({
    donor_id: target.value.id,
    requester_id: user.value.sub,
    status: "pending",
    patient_name: form.patient_name,
    hospital: form.hospital,
    location: form.location || null,
    date: form.date,
    reference: me.value?.full_name || user.value.email || null,
  });
  sending.value = false;
  if (err) {
    toast.error(`Couldn't send the request: ${err.message}`);
    return;
  }
  toast.success(`Request sent to ${target.value.full_name ?? "the donor"}.`);
  target.value = null;
  refreshNuxtData("sent-requests");
  await refresh();
}
</script>

<template>
  <div>
    <PageHeader
      title="Find donors"
      :count="availableCount"
      :subtitle="
        status === 'pending' && !donors?.length ? 'Loading donors…' : summary
      "
    />

    <div class="lg:grid lg:grid-cols-[17rem_1fr] lg:items-start lg:gap-8">
      <!-- Filters: inline on mobile, sticky sidebar on desktop -->
      <aside class="lg:card lg:sticky lg:top-24 lg:space-y-5 lg:p-5">
        <p class="label-caps hidden lg:block">Filters</p>

        <div
          class="mb-3 grid grid-cols-[auto_1fr] gap-3 lg:mb-0 lg:grid-cols-1 lg:gap-5"
        >
          <label class="block lg:hidden">
            <span class="label-caps">Blood group</span>
            <select
              :value="bloodGroup"
              class="field mt-1"
              @change="
                setFilter(
                  'bloodGroup',
                  ($event.target as HTMLSelectElement).value,
                )
              "
            >
              <option value="">Any</option>
              <option v-for="g in bloodGroups" :key="g.value" :value="g.value">
                {{ g.label }}
              </option>
            </select>
          </label>
          <!-- Desktop: one-click blood group picker -->
          <div class="hidden lg:block">
            <span class="label-caps">Blood group</span>
            <div class="mt-2 grid grid-cols-4 gap-1.5">
              <button
                v-for="g in bloodGroups"
                :key="g.value"
                type="button"
                class="rounded-lg border py-2 text-sm font-bold transition"
                :class="
                  bloodGroup === g.value
                    ? 'border-blood bg-blood text-white'
                    : 'border-line-strong text-blood-text hover:border-blood-line hover:bg-blood-dim'
                "
                :aria-pressed="bloodGroup === g.value"
                @click="
                  setFilter('bloodGroup', bloodGroup === g.value ? '' : g.value)
                "
              >
                {{ g.label }}
              </button>
            </div>
          </div>
          <label class="block">
            <span class="label-caps">Area</span>
            <select
              :value="area"
              class="field mt-1"
              @change="
                setFilter('area', ($event.target as HTMLSelectElement).value)
              "
            >
              <option value="">All areas</option>
              <option v-for="a in areas" :key="a.value" :value="a.value">
                {{ a.label }}
              </option>
            </select>
          </label>
        </div>

        <div
          class="mb-6 flex items-center justify-between gap-3 lg:mb-0 lg:flex-col lg:items-stretch"
        >
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition lg:justify-center lg:rounded-lg lg:py-2"
            :class="
              availableOnly
                ? 'border-green-800 bg-green-950 text-green-400'
                : 'border-line-strong text-muted hover:text-fg'
            "
            :aria-pressed="availableOnly"
            @click="setFilter('available', availableOnly ? '' : '1')"
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="availableOnly ? 'bg-green-500' : 'bg-line-strong'"
            />
            Available only
          </button>
          <button
            v-if="hasFilters"
            type="button"
            class="text-sm font-semibold text-blood-text hover:underline"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>
      </aside>

      <section>
        <StateMessage
          v-if="status === 'pending' && !donors?.length"
          kind="loading"
        />
        <StateMessage
          v-else-if="error"
          kind="error"
          :text="`Couldn't load donors: ${error.message}`"
        />
        <StateMessage
          v-else-if="!donors?.length"
          kind="empty"
          :text="
            hasFilters ? 'No donors match these filters.' : 'No donors yet.'
          "
        >
          <button v-if="hasFilters" class="btn-ghost" @click="clearFilters">
            Clear filters
          </button>
        </StateMessage>
        <div
          v-else
          class="grid gap-3 transition-opacity sm:grid-cols-2 lg:gap-4 xl:grid-cols-3"
          :class="{ 'opacity-50': status === 'pending' }"
        >
          <DonorCard
            v-for="d in donors"
            :key="d.id"
            :donor="d"
            :can-request="!!user"
            @request="target = $event"
          />
        </div>
      </section>
    </div>

    <ModalSheet
      v-if="target"
      :title="`Request ${target.full_name ?? 'donor'} (${target.blood_group})`"
      @close="target = null"
    >
      <DonationForm
        submit-label="Send request"
        :busy="sending"
        :show-reference="false"
        @submit="sendRequest"
        @cancel="target = null"
      />
    </ModalSheet>
  </div>
</template>
