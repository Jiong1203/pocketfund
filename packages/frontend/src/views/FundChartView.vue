<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>基金圖表</h1>
        <p>每月儲值與支出走勢</p>
      </div>
      <label class="field fund-picker">
        <span>基金</span>
        <select v-model="selectedFundId" :disabled="!funds.length">
          <option v-if="!funds.length" value="">尚無基金</option>
          <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
        </select>
      </label>
    </header>

    <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />

    <div v-if="selectedFund" class="stats">
      <div class="stat">
        <span class="stat-label">目前餘額</span>
        <span class="stat-value money" :class="{ expense: selectedFund.balance < 0 }">{{ formatMoney(selectedFund.balance) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">累計儲值</span>
        <span class="stat-value money income">{{ formatMoney(totals.topUp) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">累計支出</span>
        <span class="stat-value money expense">{{ formatMoney(totals.expense) }}</span>
      </div>
    </div>

    <AppCard title="每月金流">
      <p v-if="loading" class="loading">載入圖表資料中...</p>
      <FundFlowChart v-else :items="chartData" />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import AppCard from "../components/AppCard.vue";
import FlashMessage from "../components/FlashMessage.vue";
import FundFlowChart from "../components/FundFlowChart.vue";
import { ApiError } from "../lib/api";
import { formatMoney } from "../lib/format";
import { pocketfundApi } from "../services/pocketfund";
import type { Fund, MonthlyFlowItem } from "../types/api";

const loading = ref(false);
const funds = ref<Fund[]>([]);
const selectedFundId = ref("");
const chartData = ref<MonthlyFlowItem[]>([]);
const errorMessage = ref("");

const selectedFund = computed(() => funds.value.find((fund) => fund.id === selectedFundId.value));

const totals = computed(() =>
  chartData.value.reduce(
    (sum, item) => ({ topUp: sum.topUp + item.topUp, expense: sum.expense + item.expense }),
    { topUp: 0, expense: 0 }
  )
);

function onError(error: unknown): void {
  errorMessage.value = error instanceof ApiError ? error.message : "系統發生錯誤，請稍後再試。";
}

async function loadChartData(): Promise<void> {
  if (!selectedFundId.value) return;
  errorMessage.value = "";
  loading.value = true;
  try {
    chartData.value = await pocketfundApi.listFundMonthlyFlow(selectedFundId.value);
  } catch (error) {
    onError(error);
  } finally {
    loading.value = false;
  }
}

watch(selectedFundId, loadChartData);

onMounted(async () => {
  try {
    funds.value = await pocketfundApi.listFunds();
    selectedFundId.value = funds.value[0]?.id ?? "";
  } catch (error) {
    onError(error);
  }
});
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.page-head h1 {
  margin: 0;
  font-size: 26px;
}

.page-head p {
  margin: 4px 0 0;
  color: var(--text-muted-color);
}

.fund-picker {
  min-width: 220px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.stat:first-child {
  background: var(--primary-soft-color);
  border-color: transparent;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted-color);
}

.stat:first-child .stat-label {
  color: var(--text-color);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.loading {
  margin: 0;
  padding: 48px 16px;
  text-align: center;
  color: var(--text-muted-color);
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }

  .page-head h1 {
    font-size: 22px;
  }

  .fund-picker {
    min-width: 0;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat:first-child {
    grid-column: 1 / -1;
  }

  .stat-value {
    font-size: 18px;
  }
}
</style>
