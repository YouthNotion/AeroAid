<script setup lang="ts">
useHead({ title: "Verify your email" });

// Email confirmation by 6-digit code (sent by Supabase after sign-up).
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const toast = useToast();

const email = ref(String(route.query.email ?? ""));
const emailLocked = ref(!!email.value);
const code = ref("");
const verifying = ref(false);
const error = ref("");
const otp = ref<{ clear: () => void }>();

const redirectInfo = useSupabaseCookieRedirect();
// Navigate once: verifyOtp signs the user in, which also fires the user watcher.
let leaving = false;
function goNext() {
  if (leaving) return;
  leaving = true;
  return navigateTo(redirectInfo.pluck() || "/profile", { replace: true });
}
watch(user, (u) => u && goNext());

async function verify(token: string) {
  if (!email.value) {
    error.value = "Enter the email you signed up with first.";
    return;
  }
  verifying.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.verifyOtp({
    email: email.value,
    token,
    type: "email",
  });
  verifying.value = false;
  if (err) {
    error.value = /expired|invalid/i.test(err.message)
      ? "That code is wrong or has expired. Check the latest email, or send a new code."
      : err.message;
    otp.value?.clear();
    return;
  }
  toast.success("Email confirmed. Welcome to AeroAid!");
  await goNext();
}

// Resend with a cooldown (Supabase also limits how often emails can go out).
const cooldown = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
function startCooldown(seconds = 60) {
  cooldown.value = seconds;
  clearInterval(timer);
  timer = setInterval(() => {
    if (--cooldown.value <= 0) clearInterval(timer);
  }, 1000);
}
onMounted(() => {
  if (route.query.sent) startCooldown();
});
onBeforeUnmount(() => clearInterval(timer));

async function resend() {
  if (!email.value || cooldown.value) return;
  error.value = "";
  const { error: err } = await supabase.auth.resend({
    type: "signup",
    email: email.value,
  });
  if (err) {
    error.value = /rate limit/i.test(err.message)
      ? "Too many emails were sent recently. Please wait a while and try again."
      : err.message;
    return;
  }
  emailLocked.value = true;
  toast.success(`A new code is on its way to ${email.value}.`);
  startCooldown();
}
</script>

<template>
  <AuthCard
    title="Check your email"
    :subtitle="
      emailLocked
        ? `Enter the 6-digit code we sent to ${email}.`
        : 'Enter your email and the 6-digit code we sent you.'
    "
  >
    <div class="space-y-5">
      <label v-if="!emailLocked" class="block">
        <span class="label-caps">Email</span>
        <input
          v-model.trim="email"
          type="email"
          autocomplete="email"
          class="field mt-1"
        />
      </label>

      <div>
        <span class="label-caps">Code</span>
        <OtpInput
          ref="otp"
          v-model="code"
          class="mt-1"
          :disabled="verifying"
          :error="!!error"
          @complete="verify"
        />
        <p class="mt-2 min-h-5 text-sm" aria-live="polite">
          <span v-if="verifying" class="text-muted">Checking…</span>
          <span v-else-if="error" class="text-blood-text">{{ error }}</span>
          <span v-else class="text-muted">The code expires in 1 hour.</span>
        </p>
      </div>

      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="text-muted">Didn't get it? Check spam.</span>
        <button
          type="button"
          class="font-semibold text-blood-text hover:underline disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
          :disabled="!email || cooldown > 0"
          @click="resend"
        >
          {{ cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code" }}
        </button>
      </div>

      <NuxtLink
        v-if="emailLocked"
        to="/signup"
        class="block text-xs text-muted hover:underline"
      >
        Wrong email address? Sign up again
      </NuxtLink>
    </div>
    <template #footer>
      Already confirmed?
      <NuxtLink
        to="/login"
        class="font-semibold text-blood-text hover:underline"
        >Log in</NuxtLink
      >
    </template>
  </AuthCard>
</template>
