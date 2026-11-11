<template>
  <div class="page">
    <header class="page-head">
      <h1>個人中心</h1>
      <p>查看帳號資訊與修改密碼</p>
    </header>

    <div class="layout">
      <AppCard title="帳號資訊">
        <p v-if="profileLoading" class="muted">載入中...</p>
        <p v-else-if="profileError" class="muted">{{ profileError }}</p>
        <dl v-else-if="profile" class="info">
          <div class="info-row">
            <dt>電子郵件</dt>
            <dd>{{ profile.email }}</dd>
          </div>
          <div class="info-row">
            <dt>註冊日期</dt>
            <dd>{{ formatDate(profile.createdAt) }}</dd>
          </div>
        </dl>
      </AppCard>

      <AppCard title="修改密碼">
        <form class="password-form" novalidate @submit.prevent="submit">
          <!-- Lets password managers pair the new password with this account. -->
          <input
            v-if="profile"
            class="visually-hidden"
            type="email"
            autocomplete="username"
            :value="profile.email"
            readonly
            tabindex="-1"
            aria-hidden="true"
          />
          <label class="field">
            <span>目前密碼</span>
            <input v-model="currentPassword" type="password" autocomplete="current-password" required />
          </label>
          <label class="field">
            <span>新密碼</span>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              minlength="6"
              maxlength="72"
              placeholder="至少 6 碼"
              required
            />
          </label>
          <label class="field">
            <span>確認新密碼</span>
            <input v-model="confirmPassword" type="password" autocomplete="new-password" required />
          </label>

          <FlashMessage v-if="successMessage" type="ok" :text="successMessage" />
          <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />

          <button type="submit" class="btn submit" :disabled="saving">
            <AppIcon name="lock" :size="16" />
            {{ saving ? "更新中..." : "更新密碼" }}
          </button>
        </form>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppCard from "../components/AppCard.vue";
import AppIcon from "../components/AppIcon.vue";
import FlashMessage from "../components/FlashMessage.vue";
import { ApiError } from "../lib/api";
import { formatDate } from "../lib/format";
import { pocketfundApi } from "../services/pocketfund";
import type { UserProfile } from "../types/api";

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;

const profile = ref<UserProfile | null>(null);
const profileLoading = ref(true);
const profileError = ref("");

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const saving = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

onMounted(async () => {
  try {
    profile.value = await pocketfundApi.getProfile();
  } catch (error) {
    profileError.value = error instanceof ApiError ? error.message : "無法載入帳號資訊。";
  } finally {
    profileLoading.value = false;
  }
});

// Same rules as the API, checked first so the user gets a specific message.
function validate(): string {
  if (!currentPassword.value) return "請輸入目前的密碼。";
  if (newPassword.value.length < MIN_PASSWORD_LENGTH) return `新密碼至少需要 ${MIN_PASSWORD_LENGTH} 碼。`;
  if (newPassword.value.length > MAX_PASSWORD_LENGTH) return `新密碼最多 ${MAX_PASSWORD_LENGTH} 碼。`;
  if (newPassword.value === currentPassword.value) return "新密碼不能和目前的密碼相同。";
  if (newPassword.value !== confirmPassword.value) return "兩次輸入的新密碼不一致。";
  return "";
}

async function submit(): Promise<void> {
  successMessage.value = "";
  errorMessage.value = validate();
  if (errorMessage.value) return;

  saving.value = true;
  try {
    await pocketfundApi.changePassword(currentPassword.value, newPassword.value);
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    successMessage.value = "密碼已更新，下次登入請使用新密碼。";
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "更新失敗，請稍後再試。";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.page-head {
  margin-bottom: 20px;
}

.page-head h1 {
  margin: 0;
  font-size: 26px;
}

.page-head p {
  margin: 4px 0 0;
  color: var(--text-muted-color);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  max-width: 880px;
}

.muted {
  margin: 0;
  color: var(--text-muted-color);
  font-size: 14px;
}

.info {
  display: grid;
  gap: 12px;
  margin: 0;
}

.info-row {
  display: grid;
  gap: 2px;
}

.info dt {
  color: var(--text-muted-color);
  font-size: 13px;
}

.info dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.password-form {
  display: grid;
  gap: 14px;
}

.password-form :deep(.msg) {
  margin: 0;
}

.submit {
  justify-self: start;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .submit {
    justify-self: stretch;
  }
}
</style>
