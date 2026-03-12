<script setup lang="ts">
import { useTheme } from "./lib/theme";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <div>
    <div class="app-topbar">
      <button
        class="theme-toggle"
        type="button"
        :aria-label="isDark ? '切換淺色主題' : '切換深色主題'"
        :title="isDark ? '切換淺色主題' : '切換深色主題'"
        @click="toggleTheme"
      >
        <span v-if="isDark" aria-hidden="true">☀️</span>
        <span v-else aria-hidden="true">🌙</span>
      </button>
    </div>
    <router-view />
  </div>
</template>

<style scoped>
.app-topbar {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 100;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.theme-toggle:hover {
  border-color: var(--primary-color);
}
</style>
