<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, index) in ICON_PATHS[name]" :key="index" :d="d" />
  </svg>
</template>

<script setup lang="ts">
// Simple stroke icons (24×24) so the UI does not depend on emoji rendering per platform.
const ICON_PATHS = {
  plus: ["M12 5v14", "M5 12h14"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  edit: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
  sun: [
    "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M12 2v2",
    "M12 20v2",
    "m4.93 4.93 1.41 1.41",
    "m17.66 17.66 1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "m6.34 17.66-1.41 1.41",
    "m19.07 4.93-1.41 1.41"
  ],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M10 21v-6h4v6"],
  chart: ["M3 3v18h18", "M8 17v-5", "M13 17V8", "M18 17v-3"],
  repeat: ["m17 2 4 4-4 4", "M3 11V10a4 4 0 0 1 4-4h14", "m7 22-4-4 4-4", "M21 13v1a4 4 0 0 1-4 4H3"],
  book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z", "M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"]
} as const;

export type IconName = keyof typeof ICON_PATHS;

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 18 });
</script>

<style scoped>
.app-icon {
  flex-shrink: 0;
}
</style>
