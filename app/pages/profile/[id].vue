<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const id = computed(() => route.params.id as string);

const {
  data: profile,
  status,
  error,
} = await useAsyncData(
  () => `profile-${id.value}`,
  async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id.value)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);

const { data: donationCount } = await useAsyncData(
  () => `donation-count-${id.value}`,
  async () => {
    const { count } = await supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("donor_id", id.value)
      .eq("status", "completed");
    return count ?? 0;
  },
);

useHead({ title: () => profile.value?.full_name || "Donor" });

const age = computed(() => {
  const dob = profile.value?.date_of_birth;
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
});
</script>

<template>
  <div class="mx-auto max-w-md lg:max-w-4xl">
    <StateMessage v-if="status === 'pending'" kind="loading" />
    <StateMessage v-else-if="error" kind="error" :text="error.message" />
    <StateMessage
      v-else-if="!profile"
      kind="empty"
      text="This donor doesn't exist."
    >
      <NuxtLink to="/search" class="btn-dark">Back to search</NuxtLink>
    </StateMessage>

    <div v-else class="card lg:grid lg:grid-cols-[19rem_1fr]">
      <!-- Identity -->
      <div
        class="flex flex-col items-center gap-3 border-b border-line bg-gradient-to-b from-blood-dim to-surface p-6 lg:justify-center lg:border-r lg:border-b-0 lg:bg-gradient-to-br lg:p-8"
      >
        <AvatarImage
          :path="profile.avatar_url"
          :version="profile.updated_at"
          :alt="profile.full_name ?? ''"
          :size="112"
          class="lg:hidden"
        />
        <AvatarImage
          :path="profile.avatar_url"
          :version="profile.updated_at"
          :alt="profile.full_name ?? ''"
          :size="144"
          class="hidden lg:block"
        />
        <h1 class="text-center text-xl font-bold lg:text-2xl">
          {{ profile.full_name || "Unnamed donor" }}
        </h1>
        <div class="flex items-center gap-2">
          <BloodBadge :group="profile.blood_group" />
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="
              profile.is_available
                ? 'bg-green-500 text-white'
                : 'bg-line-strong text-soft'
            "
          >
            {{ profile.is_available ? "Available" : "Unavailable" }}
          </span>
        </div>
        <a
          v-if="profile.contact"
          :href="`tel:${profile.contact}`"
          class="btn-primary mt-2 hidden w-full lg:inline-flex"
        >
          Call {{ profile.contact }}
        </a>
      </div>

      <!-- Details -->
      <div class="flex flex-col">
        <dl
          class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 p-5 text-sm lg:grid-cols-2 lg:gap-6 lg:p-8"
        >
          <div class="contents lg:block">
            <dt class="label-caps self-center">Area</dt>
            <dd class="lg:mt-1 lg:text-base">{{ profile.area_name || "—" }}</dd>
          </div>
          <div class="contents lg:block">
            <dt class="label-caps self-center">Organization</dt>
            <dd class="lg:mt-1 lg:text-base">
              {{ profile.organization || "—" }}
            </dd>
          </div>
          <div v-if="age !== null" class="contents lg:block">
            <dt class="label-caps self-center">Age</dt>
            <dd class="lg:mt-1 lg:text-base">{{ age }}</dd>
          </div>
          <div class="contents lg:block">
            <dt class="label-caps self-center">Contact</dt>
            <dd class="lg:mt-1 lg:text-base">
              <a
                v-if="profile.contact"
                :href="`tel:${profile.contact}`"
                class="font-semibold text-blood-text hover:underline"
                >{{ profile.contact }}</a
              >
              <span v-else>—</span>
            </dd>
          </div>
          <div class="contents lg:block">
            <dt class="label-caps self-center">Donations</dt>
            <dd
              class="font-digital text-2xl leading-none text-blood-text lg:mt-1 lg:text-4xl"
            >
              {{ String(donationCount ?? 0).padStart(2, "0") }}
            </dd>
          </div>
        </dl>
        <div v-if="profile.bio" class="border-t border-line p-5 lg:px-8">
          <p class="label-caps mb-2 hidden lg:block">About</p>
          <p class="text-sm whitespace-pre-line text-soft">{{ profile.bio }}</p>
        </div>
        <div
          v-if="user?.sub === profile.id"
          class="mt-auto border-t border-line p-4 lg:px-8"
        >
          <NuxtLink to="/profile" class="btn-ghost w-full lg:w-auto"
            >Edit my profile</NuxtLink
          >
        </div>
      </div>
    </div>
  </div>
</template>
