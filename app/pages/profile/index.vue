<script setup lang="ts">
useHead({ title: "My profile" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const { data: profile, status, error, refresh } = await useMyProfile();

const form = reactive({
  full_name: "",
  blood_group: "" as BloodGroup | "",
  date_of_birth: "",
  area_name: "",
  contact: "",
  organization: "",
  bio: "",
  is_available: true,
});

watch(
  profile,
  (p) => {
    if (!p) return;
    Object.assign(form, {
      full_name: p.full_name ?? "",
      blood_group: p.blood_group ?? "",
      date_of_birth: p.date_of_birth ?? "",
      area_name: p.area_name ?? "",
      contact: p.contact ?? "",
      organization: p.organization ?? "",
      bio: p.bio ?? "",
      is_available: p.is_available ?? true,
    });
  },
  { immediate: true },
);

const saving = ref(false);
async function save() {
  if (!user.value) return;
  if (form.contact && !/^01[3-9]\d{8}$/.test(form.contact)) {
    toast.error("Enter all 11 digits of your mobile number (013–019…).");
    return;
  }
  saving.value = true;
  const { error: err } = await supabase
    .from("profiles")
    .update({
      full_name: form.full_name.trim() || null,
      blood_group: form.blood_group || null,
      date_of_birth: form.date_of_birth || null,
      area_name: form.area_name,
      contact: form.contact.trim() || null,
      organization: form.organization.trim() || null,
      bio: form.bio.trim() || null,
      is_available: form.is_available,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.value.sub);
  saving.value = false;
  if (err) return toast.error(`Couldn't save: ${err.message}`);
  toast.success("Profile saved.");
  await refresh();
}

// Avatar: pick a file → crop/zoom/rotate in AvatarCropper → upload the 512px result.
const uploading = ref(false);
const fileInput = ref<HTMLInputElement>();
const cropFile = ref<File | null>(null);

function onPick(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // allow re-picking the same file
  if (!file) return;
  if (!file.type.startsWith("image/"))
    return toast.error("Please choose an image file.");
  if (file.size > 20 * 1024 * 1024)
    return toast.error(
      "That image is over 20 MB. Please choose a smaller one.",
    );
  cropFile.value = file;
}

async function uploadCropped(blob: Blob) {
  if (!user.value) return;
  cropFile.value = null;
  uploading.value = true;
  try {
    const path = `${user.value.sub}/avatar.jpg`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) throw upErr;
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: path, updated_at: new Date().toISOString() })
      .eq("id", user.value.sub);
    if (dbErr) throw dbErr;
    toast.success("Photo updated.");
    await refresh();
  } catch (err) {
    toast.error(
      `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md lg:max-w-5xl">
    <PageHeader
      title="My profile"
      subtitle="This is what requesters see when they find you."
    />

    <StateMessage v-if="status === 'pending' && !profile" kind="loading" />
    <StateMessage v-else-if="error" kind="error" :text="error.message" />
    <StateMessage
      v-else-if="!profile"
      kind="error"
      text="No profile found for this account."
    />

    <form
      v-else
      class="space-y-5 lg:grid lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-8 lg:space-y-0"
      @submit.prevent="save"
    >
      <!-- Identity: photo + availability (sticky sidebar on desktop) -->
      <div class="space-y-5 lg:card lg:sticky lg:top-24 lg:p-5">
        <div class="flex items-center gap-4 lg:flex-col lg:text-center">
          <AvatarImage
            :path="profile.avatar_url"
            :version="profile.updated_at"
            :alt="profile.full_name ?? ''"
            :size="96"
            class="lg:hidden"
          />
          <AvatarImage
            :path="profile.avatar_url"
            :version="profile.updated_at"
            :alt="profile.full_name ?? ''"
            :size="128"
            class="hidden lg:block"
          />
          <div class="lg:w-full">
            <p class="mb-2 hidden truncate font-semibold lg:block">
              {{ profile.full_name || "Your name" }}
            </p>
            <button
              type="button"
              class="btn-ghost lg:w-full"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              {{ uploading ? "Uploading…" : "Change photo" }}
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPick"
            />
            <NuxtLink
              :to="`/profile/${profile.id}`"
              class="mt-2 block text-xs text-muted hover:underline"
            >
              View public profile →
            </NuxtLink>
          </div>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition"
          :class="
            form.is_available
              ? 'border-green-800 bg-green-950/40'
              : 'border-line-strong bg-surface'
          "
          :aria-pressed="form.is_available"
          @click="form.is_available = !form.is_available"
        >
          <span>
            <span class="block font-semibold">{{
              form.is_available ? "Available to donate" : "Not available"
            }}</span>
            <span class="text-sm text-muted"
              >Requesters can only send requests while you're available.</span
            >
          </span>
          <span
            class="relative h-6 w-11 shrink-0 rounded-full transition"
            :class="form.is_available ? 'bg-green-500' : 'bg-line-strong'"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-fg shadow transition-all"
              :class="form.is_available ? 'left-5.5' : 'left-0.5'"
            />
          </span>
        </button>
      </div>

      <!-- Details -->
      <div class="space-y-5 lg:card lg:p-6">
        <p class="label-caps hidden lg:block">Details</p>
        <div class="grid gap-5 lg:grid-cols-2">
          <label class="block lg:col-span-2">
            <span class="label-caps">Full name</span>
            <input
              v-model="form.full_name"
              class="field mt-1"
              required
              minlength="2"
            />
          </label>
          <div class="grid grid-cols-2 gap-3 lg:contents">
            <label class="block">
              <span class="label-caps">Blood group</span>
              <select v-model="form.blood_group" class="field mt-1" required>
                <option value="" disabled>Select</option>
                <option
                  v-for="g in bloodGroups"
                  :key="g.value"
                  :value="g.value"
                >
                  {{ g.label }}
                </option>
              </select>
            </label>
            <label class="block">
              <span class="label-caps">Area</span>
              <select v-model="form.area_name" class="field mt-1" required>
                <option value="" disabled>Select your area</option>
                <option v-for="a in areas" :key="a.value" :value="a.value">
                  {{ a.label }}
                </option>
              </select>
            </label>
          </div>
          <div>
            <span class="label-caps">Date of birth</span>
            <DateSelect
              v-model="form.date_of_birth"
              label="Date of birth"
              :min-year="new Date().getFullYear() - 86"
              :max-year="new Date().getFullYear() - 16"
              class="mt-1"
            />
          </div>
          <label class="block">
            <span class="label-caps">Organization</span>
            <input
              v-model="form.organization"
              class="field mt-1"
              placeholder="Airline or training institute"
              maxlength="100"
            />
          </label>
          <div class="lg:col-span-2">
            <span class="label-caps">Mobile number</span>
            <PhoneInput v-model="form.contact" class="mt-1" />
            <span class="text-xs text-muted"
              >Shown to logged-in members who request you.</span
            >
          </div>
          <label class="block lg:col-span-2">
            <span class="label-caps">Bio</span>
            <textarea
              v-model="form.bio"
              rows="3"
              class="field mt-1"
              maxlength="300"
            />
          </label>
        </div>
        <div class="lg:flex lg:justify-end lg:border-t lg:border-line lg:pt-5">
          <button
            class="btn-primary w-full lg:w-auto lg:px-8"
            :disabled="saving"
          >
            {{ saving ? "Saving…" : "Save profile" }}
          </button>
        </div>
      </div>
    </form>

    <ModalSheet
      v-if="cropFile"
      title="Adjust your photo"
      @close="cropFile = null"
    >
      <AvatarCropper
        :file="cropFile"
        @cancel="cropFile = null"
        @confirm="uploadCropped"
      />
    </ModalSheet>
  </div>
</template>
