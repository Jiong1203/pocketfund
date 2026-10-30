<template>
  <button
    type="button"
    class="btn btn-icon"
    :aria-label="isDark ? '切換淺色主題' : '切換深色主題'"
    :title="isDark ? '切換淺色主題' : '切換深色主題'"
    @click="toggleTheme"
  >
    <AppIcon :name="isDark ? 'sun' : 'moon'" />
  </button>
</template>

<script setup lang="ts">
import { useTheme } from "../lib/theme";
import AppIcon from "./AppIcon.vue";

const { isDark, toggleTheme } = useTheme();
</script>
