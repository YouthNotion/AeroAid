<script setup lang="ts">
export type DonationFormData = {
  patient_name: string;
  hospital: string;
  location: string;
  date: string;
  reference: string;
};

const props = withDefaults(
  defineProps<{
    submitLabel?: string;
    busy?: boolean;
    initial?: Partial<DonationFormData>;
    showReference?: boolean;
  }>(),
  {
    submitLabel: "Save",
    busy: false,
    initial: () => ({}),
    showReference: true,
  },
);
const emit = defineEmits<{ submit: [DonationFormData]; cancel: [] }>();

const form = reactive<DonationFormData>({
  patient_name: "",
  hospital: "",
  location: "",
  // Local date (toISOString would give the UTC date: yesterday before 6am in Dhaka).
  date: new Date().toLocaleDateString("en-CA"),
  reference: "",
  ...props.initial,
});
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit', { ...form })">
    <label class="block">
      <span class="label-caps">Patient name</span>
      <input
        v-model.trim="form.patient_name"
        class="field mt-1"
        required
        maxlength="100"
      />
    </label>
    <label class="block">
      <span class="label-caps">Hospital</span>
      <input
        v-model.trim="form.hospital"
        class="field mt-1"
        required
        maxlength="150"
      />
    </label>
    <label class="block">
      <span class="label-caps">Location</span>
      <input
        v-model.trim="form.location"
        class="field mt-1"
        placeholder="Ward, floor, address"
        maxlength="200"
      />
    </label>
    <div>
      <span class="label-caps">Date</span>
      <DateSelect
        v-model="form.date"
        label="Date"
        required
        :min-year="new Date().getFullYear() - 30"
        :max-year="new Date().getFullYear() + 1"
        class="mt-1"
      />
    </div>
    <label v-if="showReference" class="block">
      <span class="label-caps">Reference</span>
      <input
        v-model.trim="form.reference"
        class="field mt-1"
        placeholder="Who referred this?"
        maxlength="100"
      />
    </label>
    <div class="flex gap-2 pt-2">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn-primary flex-1" :disabled="busy">
        {{ busy ? "Saving…" : submitLabel }}
      </button>
    </div>
  </form>
</template>
