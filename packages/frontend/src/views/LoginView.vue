<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "../lib/api";
import { setAccessToken } from "../lib/session";
import { pocketfundApi } from "../services/pocketfund";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const mode = ref<"login" | "register">("login");
const errorMessage = ref("");

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
    const typed = error as ApiError;
    errorMessage.value = typed.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="panel">
      <h1>pocketfund</h1>
      <p>請先登入或註冊以使用資金帳本功能</p>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" type="button" @click="mode = 'login'">登入</button>
        <button :class="{ active: mode === 'register' }" type="button" @click="mode = 'register'">註冊</button>
      </div>

      <form @submit.prevent="submit">
        <label>
          電子郵件
          <input v-model="email" type="email" required placeholder="you@example.com" />
        </label>
        <label>
          密碼
          <input v-model="password" type="password" minlength="8" required placeholder="至少 8 碼" />
        </label>
        <button type="submit" :disabled="loading">
          {{ loading ? "處理中..." : mode === "login" ? "登入" : "建立帳號" }}
        </button>
      </form>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.panel {
  width: 100%;
  max-width: 420px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

h1 {
  margin: 0 0 8px;
}

p {
  margin: 0 0 16px;
  color: var(--text-muted-color);
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.tabs button {
  border: 1px solid var(--border-strong-color);
  background: var(--surface-muted-color);
  color: var(--text-color);
  font-weight: 700;
}

.tabs button.active {
  background: var(--primary-color);
  color: var(--primary-contrast);
  border-color: var(--primary-color);
}

form {
  display: grid;
  gap: 10px;
}

label {
  display: grid;
  gap: 4px;
  font-size: 14px;
}

input {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
  color: var(--text-color);
}

button {
  padding: 10px;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  background: var(--primary-color);
  color: var(--primary-contrast);
  cursor: pointer;
}

.error {
  margin-top: 10px;
  color: var(--error-color);
}
</style>
