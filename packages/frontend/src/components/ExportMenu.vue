<template>
  <div ref="root" class="export-menu">
    <button
      type="button"
      class="btn btn-icon"
      aria-label="匯出資料"
      title="匯出資料"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <AppIcon name="download" />
    </button>

    <div v-if="open" class="menu" role="menu">
      <p class="menu-title">匯出資料</p>
      <button type="button" class="menu-item" role="menuitem" :disabled="busy" @click="run('csv')">
        <span class="item-label">交易明細（CSV）</span>
        <span class="item-hint">可用 Excel 或 Google 試算表開啟</span>
      </button>
      <button type="button" class="menu-item" role="menuitem" :disabled="busy" @click="run('json')">
        <span class="item-label">完整備份（JSON）</span>
        <span class="item-hint">包含基金、帳戶、交易與自動儲值設定</span>
      </button>
      <p v-if="busy" class="menu-status" role="status">匯出中...</p>
      <p v-else-if="errorMessage" class="menu-status error" role="alert">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ApiError } from "../lib/api";
import { pocketfundApi } from "../services/pocketfund";
import AppIcon from "./AppIcon.vue";

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const busy = ref(false);
const errorMessage = ref("");

function toggle(): void {
  open.value = !open.value;
  errorMessage.value = "";
}

async function run(format: "csv" | "json"): Promise<void> {
  busy.value = true;
  errorMessage.value = "";
  try {
    const { blob, fileName } =
      format === "csv" ? await pocketfundApi.exportTransactionsCsv() : await pocketfundApi.exportBackup();
    saveFile(blob, fileName);
    open.value = false;
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "匯出失敗，請稍後再試。";
  } finally {
    busy.value = false;
  }
}

function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.export-menu {
  position: relative;
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: min(280px, calc(100vw - 2 * var(--page-gutter)));
  padding: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.menu-title {
  margin: 4px 8px 6px;
  color: var(--text-muted-color);
  font-size: 12px;
  font-weight: 600;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
}

.menu-item:hover:not(:disabled),
.menu-item:focus-visible {
  background: var(--surface-muted-color);
}

.menu-item:disabled {
  cursor: wait;
  opacity: 0.6;
}

.item-label {
  font-size: 14px;
  font-weight: 600;
}

.item-hint {
  color: var(--text-muted-color);
  font-size: 12px;
}

.menu-status {
  margin: 6px 8px 2px;
  color: var(--text-muted-color);
  font-size: 12px;
}

.menu-status.error {
  color: var(--error-color);
}
</style>
