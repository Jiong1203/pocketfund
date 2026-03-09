<script setup lang="ts">
import { useTheme } from "../lib/theme";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button class="theme-toggle" type="button" @click="toggleTheme">
    {{ isDark ? "切換淺色主題" : "切換深色主題" }}
  </button>
</template>

<style scoped>
.theme-toggle {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color);
  cursor: pointer;
}

.theme-toggle:hover {
  border-color: var(--primary-color);
}
</style>
