<template>
  <table class="tx-table">
    <thead>
      <tr>
        <th>類型</th>
        <th>說明</th>
        <th>日期</th>
        <th class="col-amount">金額</th>
        <th class="col-actions"><span class="sr-only">操作</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in rows" :key="item.id">
        <td class="col-type">
          <span class="type-badge" :class="`type-${item.type.toLowerCase()}`">{{ TYPE_LABELS[item.type] ?? item.type }}</span>
        </td>
        <td class="col-desc" :title="item.description ?? undefined">{{ item.description || "（無說明）" }}</td>
        <td class="col-date">{{ formatDate(item.occurred_at) }}</td>
        <td class="col-amount money" :class="Number(item.amount) < 0 ? 'expense' : 'income'">
          {{ formatSignedMoney(Number(item.amount)) }}
        </td>
        <td class="col-actions">
          <button type="button" class="btn btn-icon" title="編輯" aria-label="編輯交易" @click="emit('edit', item)">
            <AppIcon name="edit" :size="16" />
          </button>
          <button type="button" class="btn btn-icon danger" title="刪除" aria-label="刪除交易" @click="emit('delete', item)">
            <AppIcon name="trash" :size="16" />
          </button>
        </td>
      </tr>
      <tr v-if="rows.length === 0" class="empty-row">
        <td colspan="5" class="empty">{{ emptyText ?? "尚無交易紀錄" }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { formatDate, formatSignedMoney } from "../lib/format";
import type { TransactionRecord } from "../types/api";
import AppIcon from "./AppIcon.vue";

const TYPE_LABELS: Record<string, string> = {
  TOP_UP: "儲值",
  EXPENSE: "支出",
  TRANSFER: "轉帳"
};

defineProps<{
  rows: TransactionRecord[];
  emptyText?: string;
}>();

const emit = defineEmits<{
  edit: [row: TransactionRecord];
  delete: [row: TransactionRecord];
}>();
</script>

<style scoped>
.tx-table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  font-size: 14px;
}

th {
  background: var(--surface-muted-color);
  color: var(--text-muted-color);
  font-weight: 600;
  font-size: 13px;
}

th:first-child {
  border-top-left-radius: var(--radius-sm);
}

th:last-child {
  border-top-right-radius: var(--radius-sm);
}

tbody tr:not(.empty-row):hover {
  background: var(--surface-muted-color);
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.type-top_up {
  background: color-mix(in srgb, var(--income-color) 15%, transparent);
  color: var(--income-color);
}

.type-expense {
  background: color-mix(in srgb, var(--expense-color) 15%, transparent);
  color: var(--expense-color);
}

.type-transfer {
  background: color-mix(in srgb, #6366f1 15%, transparent);
  color: #6366f1;
}

.col-desc {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-date {
  color: var(--text-muted-color);
  white-space: nowrap;
}

.col-amount {
  text-align: right;
  font-weight: 600;
  white-space: nowrap;
}

.col-actions {
  width: 88px;
  text-align: right;
  white-space: nowrap;
}

.empty {
  padding: 32px;
  text-align: center;
  color: var(--text-muted-color);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Phones: each transaction becomes a two-line card instead of a wide table row. */
@media (max-width: 640px) {
  thead {
    display: none;
  }

  .tx-table,
  tbody {
    display: block;
  }

  tbody tr:not(.empty-row) {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      "type desc amount"
      "date date actions";
    align-items: center;
    column-gap: 8px;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border-color);
  }

  tbody tr td {
    padding: 0;
    border: none;
  }

  .col-type {
    grid-area: type;
  }

  .col-desc {
    grid-area: desc;
    max-width: none;
    min-width: 0;
  }

  .col-amount {
    grid-area: amount;
    font-size: 15px;
  }

  .col-date {
    grid-area: date;
    font-size: 12px;
  }

  .col-actions {
    grid-area: actions;
    width: auto;
  }

  .empty-row {
    display: block;
  }

  .empty-row td {
    display: block;
    border: none;
  }
}
</style>
