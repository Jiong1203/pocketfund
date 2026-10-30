<template>
  <div class="login-page">
    <div class="theme-corner">
      <ThemeToggle />
    </div>

    <div class="panel">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">P</span>
        <div>
          <h1>PocketFund</h1>
          <p>把錢分進不同口袋，每一筆都清清楚楚</p>
        </div>
      </div>

      <div class="tabs" role="tablist" aria-label="登入或註冊">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'login'"
          :class="{ active: mode === 'login' }"
          @click="switchMode('login')"
        >登入</button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'register'"
          :class="{ active: mode === 'register' }"
          @click="switchMode('register')"
        >註冊</button>
      </div>

      <form @submit.prevent="submit">
        <label class="field">
          <span>電子郵件</span>
          <input v-model.trim="email" type="email" autocomplete="email" required placeholder="you@example.com" />
        </label>
        <label class="field">
          <span>密碼</span>
          <input
            v-model="password"
            type="password"
            minlength="6"
            required
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            placeholder="至少 6 碼"
          />
        </label>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <button type="submit" class="btn submit" :disabled="loading">
          {{ loading ? "處理中..." : mode === "login" ? "登入" : "建立帳號" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ThemeToggle from "../components/ThemeToggle.vue";
import { ApiError } from "../lib/api";
import { setAccessToken } from "../lib/session";
import { pocketfundApi } from "../services/pocketfund";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const mode = ref<"login" | "register">("login");
const errorMessage = ref("");

function switchMode(next: "login" | "register"): void {
  mode.value = next;
  errorMessage.value = "";
}

async function submit(): Promise<void> {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data =
      mode.value === "login"
        ? await pocketfundApi.login(email.value, password.value)
        : await pocketfundApi.register(email.value, password.value);
    setAccessToken(data.accessToken);
    await router.push({ name: "dashboard" });
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "系統發生錯誤，請稍後再試。";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 72px var(--page-gutter) 32px;
  background:
    radial-gradient(circle at 15% 10%, var(--primary-soft-color), transparent 45%),
    var(--bg-color);
}

.theme-corner {
  position: absolute;
  top: 12px;
  right: 12px;
}

.panel {
  width: 100%;
  max-width: 400px;
  padding: 32px 28px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.brand-mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--primary-color);
  color: var(--primary-contrast);
  font-size: 24px;
  font-weight: 800;
}

h1 {
  margin: 0;
  font-size: 24px;
}

.brand p {
  margin: 2px 0 0;
  color: var(--text-muted-color);
  font-size: 14px;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  background: var(--surface-muted-color);
  border-radius: var(--radius-md);
}

.tabs button {
  min-height: 38px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted-color);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.tabs button.active {
  background: var(--surface-color);
  color: var(--text-color);
  box-shadow: var(--shadow-sm);
}

form {
  display: grid;
  gap: 14px;
}

.submit {
  width: 100%;
  min-height: 44px;
  margin-top: 4px;
  font-size: 15px;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--error-color) 10%, transparent);
  color: var(--error-color);
  font-size: 14px;
}

@media (max-width: 640px) {
  .panel {
    padding: 24px 20px;
  }
}
</style>
