import { computed, readonly, ref } from "vue";

export type Theme = "light" | "dark";

const THEME_KEY = "pocketfund_theme";
const currentTheme = ref<Theme>("light");

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") {
    currentTheme.value = saved;
    applyTheme(saved);
    return;
  }

  const preferredDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  currentTheme.value = preferredDark ? "dark" : "light";
  applyTheme(currentTheme.value);
}

export function setTheme(theme: Theme): void {
  currentTheme.value = theme;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function useTheme() {
  const isDark = computed(() => currentTheme.value === "dark");
  const toggleTheme = (): void => {
    setTheme(currentTheme.value === "dark" ? "light" : "dark");
  };

  return {
    theme: readonly(currentTheme),
    isDark,
    setTheme,
    toggleTheme
  };
}
