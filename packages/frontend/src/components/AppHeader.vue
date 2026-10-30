<template>
  <header class="app-header">
    <div class="app-header-inner">
      <RouterLink :to="{ name: 'dashboard' }" class="brand" aria-label="PocketFund 首頁">
        <span class="brand-mark" aria-hidden="true">P</span>
        <span class="brand-name">PocketFund</span>
      </RouterLink>

      <nav class="nav" aria-label="主要導覽">
        <RouterLink :to="{ name: 'dashboard' }" class="nav-link">
          <AppIcon name="home" />
          <span>儀表板</span>
        </RouterLink>
        <RouterLink :to="{ name: 'schedules' }" class="nav-link">
          <AppIcon name="repeat" />
          <span>自動儲值</span>
        </RouterLink>
        <RouterLink :to="{ name: 'charts' }" class="nav-link">
          <AppIcon name="chart" />
          <span>圖表</span>
        </RouterLink>
      </nav>

      <div class="actions">
        <button type="button" class="btn btn-icon" aria-label="使用手冊" title="使用手冊" @click="showManual = true">
          <AppIcon name="book" />
        </button>
        <ThemeToggle />
        <button type="button" class="btn btn-icon" aria-label="登出" title="登出" @click="logout">
          <AppIcon name="logout" />
        </button>
      </div>
    </div>
    <UserManualModal v-model="showManual" />
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { clearAccessToken } from "../lib/session";
import AppIcon from "./AppIcon.vue";
import ThemeToggle from "./ThemeToggle.vue";
import UserManualModal from "./UserManualModal.vue";

const router = useRouter();
const showManual = ref(false);

async function logout(): Promise<void> {
  clearAccessToken();
  await router.push({ name: "login" });
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--surface-color) 88%, transparent);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.app-header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  height: 60px;
  margin: 0 auto;
  padding: 0 var(--page-gutter);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-color);
  text-decoration: none;
  font-weight: 700;
  font-size: 18px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--primary-color);
  color: var(--primary-contrast);
  font-size: 16px;
  font-weight: 800;
}

.nav {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-muted-color);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition-fast);
}

.nav-link:hover {
  background: var(--surface-muted-color);
  color: var(--text-color);
}

.nav-link.router-link-active {
  background: var(--primary-soft-color);
  color: var(--text-color);
}

.actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

/* Phones: the nav moves to a bottom tab bar so it stays reachable with one thumb. */
@media (max-width: 640px) {
  /* backdrop-filter would make the header the containing block of the fixed tab bar. */
  .app-header {
    backdrop-filter: none;
    background: var(--surface-color);
  }

  .nav {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    justify-content: space-around;
    gap: 0;
    margin: 0;
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--surface-color) 94%, transparent);
    border-top: 1px solid var(--border-color);
    backdrop-filter: blur(8px);
  }

  .nav-link {
    flex: 1;
    flex-direction: column;
    gap: 2px;
    padding: 6px 4px;
    font-size: 11px;
  }
}
</style>
