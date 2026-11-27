<script setup lang="ts">
import { z } from "zod";

useHead({ title: "Sign up" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
watch(user, (u) => u && navigateTo("/search", { replace: true }), {
  immediate: true,
});

const schema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(4, "Full name must be at least 4 characters"),
    email: z.email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Enter your 11-digit mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string(),
    dateOfBirth: z.iso.date("Enter your date of birth"),
    bloodGroup: z.enum(BLOOD_GROUPS, "Select your blood group"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const form = reactive({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  bloodGroup: "",
});
// The birth-year list starts 16 years back.
const maxDobYear = new Date().getFullYear() - 16;
const errors = ref<Record<string, string>>({});
const busy = ref(false);
const serverError = ref("");

async function submit() {
  serverError.value = "";
  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    errors.value = Object.fromEntries(
      parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
    );
    return;
  }
  errors.value = {};
  busy.value = true;
  const d = parsed.data;
  // The account isn't usable until the email code is entered, so the phone number
  // travels as signup metadata and is copied into the profile on first login
  // (see useMyProfile).
  const { error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      data: {
        full_name: d.fullName,
        date_of_birth: d.dateOfBirth,
        blood_group: d.bloodGroup,
        contact: d.phone,
      },
    },
  });
  busy.value = false;
  if (error) {
    serverError.value = error.message;
    return;
  }
  await navigateTo({ path: "/verify", query: { email: d.email, sent: "1" } });
}
</script>

<template>
  <AuthCard
    title="Become a donor"
    subtitle="Join the aviation community's blood donor network."
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div class="grid gap-4 lg:grid-cols-2 lg:gap-3">
        <label class="block">
          <span class="label-caps">Full name</span>
          <input
            v-model="form.fullName"
            autocomplete="name"
            class="field mt-1"
          />
          <span v-if="errors.fullName" class="text-xs text-blood-text">{{
            errors.fullName
          }}</span>
        </label>
        <label class="block">
          <span class="label-caps">Email</span>
          <input
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            class="field mt-1"
          />
          <span v-if="errors.email" class="text-xs text-blood-text">{{
            errors.email
          }}</span>
        </label>
      </div>

      <div>
        <span class="label-caps">Mobile number</span>
        <PhoneInput v-model="form.phone" class="mt-1" required />
        <span v-if="errors.phone" class="text-xs text-blood-text">{{
          errors.phone
        }}</span>
      </div>

      <!-- Blood group + date of birth: side by side on desktop, stacked on phones -->
      <div class="grid gap-4 lg:grid-cols-[6.5rem_1fr] lg:gap-3">
        <label class="block">
          <span class="label-caps">Blood group</span>
          <select v-model="form.bloodGroup" class="field mt-1">
            <option value="" disabled>Select</option>
            <option v-for="g in bloodGroups" :key="g.value" :value="g.value">
              {{ g.label }}
            </option>
          </select>
          <span v-if="errors.bloodGroup" class="text-xs text-blood-text">{{
            errors.bloodGroup
          }}</span>
        </label>
        <div>
          <span class="label-caps">Date of birth</span>
          <DateSelect
            v-model="form.dateOfBirth"
            label="Date of birth"
            :min-year="maxDobYear - 70"
            :max-year="maxDobYear"
            class="mt-1"
          />
          <span v-if="errors.dateOfBirth" class="text-xs text-blood-text">{{
            errors.dateOfBirth
          }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="label-caps">Password</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="field mt-1"
          />
          <span v-if="errors.password" class="text-xs text-blood-text">{{
            errors.password
          }}</span>
        </label>
        <label class="block">
          <span class="label-caps">Confirm</span>
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            class="field mt-1"
          />
          <span v-if="errors.confirmPassword" class="text-xs text-blood-text">{{
            errors.confirmPassword
          }}</span>
        </label>
      </div>

      <p
        v-if="serverError"
        class="rounded-md bg-blood-dim p-3 text-sm text-blood-text"
      >
        {{ serverError }}
      </p>
      <button class="btn-primary w-full" :disabled="busy">
        {{ busy ? "Creating account…" : "Create account" }}
      </button>
    </form>
    <template #footer>
      Already a member?
      <NuxtLink
        to="/login"
        class="font-semibold text-blood-text hover:underline"
        >Log in</NuxtLink
      >
    </template>
  </AuthCard>
</template>
