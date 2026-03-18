<script setup lang="ts">
import type { TransactionRecord } from "../types/api";

defineProps<{
  rows: TransactionRecord[];
}>();
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>類型</th>
        <th>金額</th>
        <th>說明</th>
        <th>時間</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in rows" :key="item.id">
        <td>{{ item.type }}</td>
        <td>{{ item.amount }}</td>
        <td>{{ item.description ?? "-" }}</td>
        <td>{{ new Date(item.occurred_at).toLocaleString("zh-TW") }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  padding: 12px 16px;
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
</style>
