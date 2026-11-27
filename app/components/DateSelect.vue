<script setup lang="ts">
/**
 * Day / Month / Year picker. Native <input type="date"> follows the device locale
 * (often MM/DD/YYYY) and can't be forced to DD/MM/YYYY, so we use three selects.
 * v-model is an ISO date string ('YYYY-MM-DD') or '' when incomplete.
 */
const props = withDefaults(
  defineProps<{
    minYear?: number;
    maxYear?: number;
    required?: boolean;
    label?: string;
  }>(),
  {
    minYear: 1940,
    maxYear: new Date().getFullYear(),
    required: false,
    label: "Date",
  },
);
const model = defineModel<string>({ default: "" });

// Display labels only: the value saved is the month number inside an ISO date.
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const day = ref("");
const month = ref("");
const year = ref("");

// Sync in from the model (initial value, or the parent loading a saved date).
watch(
  model,
  (v) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
    if (m) {
      year.value = m[1]!;
      month.value = String(Number(m[2]));
      day.value = String(Number(m[3]));
    } else if (!v) {
      day.value = month.value = year.value = "";
    }
  },
  { immediate: true },
);

const years = computed(() => {
  const out: number[] = [];
  for (let y = props.maxYear; y >= props.minYear; y--) out.push(y);
  return out;
});
const daysInMonth = computed(() => {
  if (!month.value) return 31;
  const y = Number(year.value) || 2000; // leap year default so Feb 29 stays selectable
  return new Date(y, Number(month.value), 0).getDate();
});

// Sync out once all three parts are chosen; clamp the day (e.g. 31 → 30 in April).
watch([day, month, year], () => {
  if (day.value && Number(day.value) > daysInMonth.value)
    day.value = String(daysInMonth.value);
  if (day.value && month.value && year.value) {
    model.value = `${year.value}-${month.value.padStart(2, "0")}-${day.value.padStart(2, "0")}`;
  } else if (model.value) {
    model.value = "";
  }
});
</script>

<template>
  <div
    class="grid grid-cols-[1fr_1.2fr_1.3fr] gap-2"
    role="group"
    :aria-label="label"
  >
    <select
      v-model="day"
      class="field"
      :required="required"
      :aria-label="`${label}: day`"
    >
      <option value="" disabled>Day</option>
      <option v-for="d in daysInMonth" :key="d" :value="String(d)">
        {{ String(d).padStart(2, "0") }}
      </option>
    </select>
    <select
      v-model="month"
      class="field"
      :required="required"
      :aria-label="`${label}: month`"
    >
      <option value="" disabled>Month</option>
      <option v-for="(m, i) in MONTHS" :key="m" :value="String(i + 1)">
        {{ m }}
      </option>
    </select>
    <select
      v-model="year"
      class="field"
      :required="required"
      :aria-label="`${label}: year`"
    >
      <option value="" disabled>Year</option>
      <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
    </select>
  </div>
</template>
