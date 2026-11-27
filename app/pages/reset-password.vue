<script setup lang="ts">
useHead({ title: "Reset password" });

// Password reset by code, all on one page:
// 1) email → Supabase sends a 6-digit code
// 2) code  → verifyOtp signs the user in (recovery session)
// 3) new password → updateUser
const supabase = useSupabaseClient();
const toast = useToast();

const step = ref<"email" | "code" | "password">("email");
const email = ref("");
const code = ref("");
const password = ref("");
const confirm = ref("");
const busy = ref(false);
const error = ref("");
const otp = ref<{ clear: () => void }>();

// Resend cooldown (Supabase also limits how often emails can go out).
const cooldown = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
function startCooldown(seconds = 60) {
  cooldown.value = seconds;
  clearInterval(timer);
  timer = setInterval(() => {
    if (--cooldown.value <= 0) clearInterval(timer);
  }, 1000);
}
onBeforeUnmount(() => clearInterval(timer));

function friendly(message: string) {
  return /rate limit/i.test(message)
    ? "Too many emails were sent recently. Please wait a while and try again."
    : message;
}

async function sendCode() {
  if (!email.value) return;
  busy.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.resetPasswordForEmail(email.value);
  busy.value = false;
  if (err) return (error.value = friendly(err.message));
  step.value = "code";
  startCooldown();
}

async function verifyCode(token: string) {
  busy.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.verifyOtp({
    email: email.value,
    token,
    type: "recovery",
  });
  busy.value = false;
  if (err) {
    error.value = /expired|invalid/i.test(err.message)
      ? "That code is wrong or has expired. Check the latest email, or send a new code."
      : err.message;
    otp.value?.clear();
    return;
  }
  step.value = "password";
}

async function savePassword() {
  error.value = "";
  if (password.value.length < 8)
    return (error.value = "Password must be at least 8 characters.");
  if (password.value !== confirm.value)
    return (error.value = "Passwords don't match.");
  busy.value = true;
  const { error: err } = await supabase.auth.updateUser({
    password: password.value,
  });
  busy.value = false;
  if (err) return (error.value = err.message);
  toast.success("Password updated. You're logged in.");
  await navigateTo("/search", { replace: true });
}

const subtitle = computed(
  () =>
    ({
      email: "We'll email you a 6-digit code.",
      code: `Enter the code we sent to ${email.value}.`,
      password: "Choose a new password for your account.",
    })[step.value],
);
</script>

<template>
  <AuthCard title="Reset password" :subtitle="subtitle">
    <!-- 1. Email -->
    <form v-if="step === 'email'" class="space-y-4" @submit.prevent="sendCode">
      <label class="block">
        <span class="label-caps">Email</span>
        <input
          v-model.trim="email"
          type="email"
          autocomplete="email"
          class="field mt-1"
          required
        />
      </label>
      <p
        v-if="error"
        class="rounded-md bg-blood-dim p-3 text-sm text-blood-text"
      >
        {{ error }}
      </p>
      <button class="btn-primary w-full" :disabled="busy">
        {{ busy ? "Sending…" : "Send code" }}
      </button>
    </form>

    <!-- 2. Code -->
    <div v-else-if="step === 'code'" class="space-y-5">
      <div>
        <span class="label-caps">Code</span>
        <OtpInput
          ref="otp"
          v-model="code"
          class="mt-1"
          :disabled="busy"
          :error="!!error"
          @complete="verifyCode"
        />
        <p class="mt-2 min-h-5 text-sm" aria-live="polite">
          <span v-if="busy" class="text-muted">Checking…</span>
          <span v-else-if="error" class="text-blood-text">{{ error }}</span>
          <span v-else class="text-muted">
            If an account exists for this email, the code is on its way. It
            expires in 1 hour.
          </span>
        </p>
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          class="text-muted hover:underline"
          @click="((step = 'email'), (error = ''))"
        >
          Use a different email
        </button>
        <button
          type="button"
          class="font-semibold text-blood-text hover:underline disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
          :disabled="cooldown > 0 || busy"
          @click="sendCode"
        >
          {{ cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code" }}
        </button>
      </div>
    </div>

    <!-- 3. New password -->
    <form v-else class="space-y-4" @submit.prevent="savePassword">
      <label class="block">
        <span class="label-caps">New password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="field mt-1"
          required
          minlength="8"
        />
      </label>
      <label class="block">
        <span class="label-caps">Confirm password</span>
        <input
          v-model="confirm"
          type="password"
          autocomplete="new-password"
          class="field mt-1"
          required
        />
      </label>
      <p
        v-if="error"
        class="rounded-md bg-blood-dim p-3 text-sm text-blood-text"
      >
        {{ error }}
      </p>
      <button class="btn-primary w-full" :disabled="busy">
        {{ busy ? "Saving…" : "Update password" }}
      </button>
    </form>

    <template #footer>
      <NuxtLink
        to="/login"
        class="font-semibold text-blood-text hover:underline"
        >Back to log in</NuxtLink
      >
    </template>
  </AuthCard>
</template>
