<template>
  <table>
    <thead>
      <tr>
        <th>類型</th>
        <th>金額</th>
        <th>說明</th>
        <th>時間</th>
        <th class="col-actions">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in rows" :key="item.id">
        <td>
          <span class="type-badge" :class="`type-${item.type.toLowerCase()}`">{{ typeMap[item.type] || item.type }}</span>
        </td>
        <td class="col-amount" :class="{ negative: Number(item.amount) < 0 }">
          {{ Number(item.amount).toLocaleString("zh-TW", { maximumFractionDigits: 0 }) }}
        </td>
        <td class="col-desc">{{ item.description ?? "-" }}</td>
        <td class="col-date">{{ new Date(item.occurred_at).toLocaleString("zh-TW") }}</td>
        <td class="col-actions">
          <button type="button" class="btn-icon btn-edit" title="編輯" @click="emit('edit', item)">✏️</button>
          <button type="button" class="btn-icon btn-delete" title="刪除" @click="emit('delete', item)">🗑️</button>
        </td>
      </tr>
      <tr v-if="rows.length === 0">
        <td colspan="5" class="empty">尚無交易記錄</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { TransactionRecord } from "../types/api";

const typeMap: Record<string, string> = {
  TOP_UP: '儲值',
  EXPENSE: '支出',
  TRANSFER: '轉帳'
};

defineProps<{
  rows: TransactionRecord[];
}>();

const emit = defineEmits<{
  edit: [row: TransactionRecord];
  delete: [row: TransactionRecord];
}>();
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
}

th {
  background: var(--surface-muted-color);
  font-weight: 600;
  color: var(--text-muted-color);
}

tbody tr {
  transition: var(--transition-fast);
}

tbody tr:hover {
  background: var(--surface-muted-color);
}

/* Type badge */
.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
}

.type-top_up {
  background: color-mix(in srgb, #22c55e 15%, transparent);
  color: #16a34a;
}

.type-expense {
  background: color-mix(in srgb, #ef4444 15%, transparent);
  color: #dc2626;
}

.type-transfer {
  background: color-mix(in srgb, #6366f1 15%, transparent);
  color: #4f46e5;
}

/* Amount */
.col-amount {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.col-amount.negative {
  color: #dc2626;
}

/* Desc / Date */
.col-desc {
  color: var(--text-muted-color);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-date {
  color: var(--text-muted-color);
  white-space: nowrap;
}

/* Actions column */
.col-actions {
  width: 80px;
  text-align: center;
  white-space: nowrap;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1;
  box-shadow: none;
  filter: none;
}

.btn-icon:hover {
  background: var(--surface-muted-color);
  box-shadow: none;
  filter: none;
}

.empty {
  text-align: center;
  color: var(--text-muted-color);
  padding: 32px;
}
</style>
