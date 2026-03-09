<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../components/AppCard.vue";
import FlashMessage from "../components/FlashMessage.vue";
import FundFlowChart from "../components/FundFlowChart.vue";
import { ApiError } from "../lib/api";
import { clearAccessToken } from "../lib/session";
import { pocketfundApi } from "../services/pocketfund";
import type { Fund, MonthlyFlowItem } from "../types/api";

const router = useRouter();
const loading = ref(false);
const funds = ref<Fund[]>([]);
const selectedFundId = ref("");
const chartData = ref<MonthlyFlowItem[]>([]);
const errorMessage = ref("");

function onError(error: unknown): void {
  const typed = error as ApiError;
  errorMessage.value = typed.message;
}

async function loadFunds(): Promise<void> {
  funds.value = await pocketfundApi.listFunds();
  if (!selectedFundId.value && funds.value[0]) {
    selectedFundId.value = funds.value[0].id;
  }
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

async function logout(): Promise<void> {
  clearAccessToken();
  await router.push({ name: "login" });
}

onMounted(async () => {
  try {
    await loadFunds();
    await loadChartData();
  } catch (error) {
    onError(error);
  }
});
</script>

<template>
  <div class="page">
    <header class="top">
      <div>
        <h1>基金圖表中心</h1>
        <p>以月份聚合呈現儲值與支出走勢</p>
      </div>
      <div class="actions">
        <button type="button" @click="$router.push({ name: 'dashboard' })">返回儀表板</button>
        <button type="button" @click="logout">登出</button>
      </div>
    </header>

    <FlashMessage v-if="loading" type="hint" text="載入圖表資料中..." />
    <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />

    <AppCard title="圖表條件">
      <form class="filter" @submit.prevent="loadChartData">
        <select v-model="selectedFundId" required>
          <option disabled value="">請選擇基金</option>
          <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
        </select>
        <button type="submit">更新圖表</button>
      </form>
    </AppCard>

    <AppCard title="每月金流圖">
      <FundFlowChart :items="chartData" />
    </AppCard>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top h1 {
  margin: 0;
}

.top p {
  margin: 4px 0 0;
  color: #4b5563;
}

.actions {
  display: flex;
  gap: 8px;
}

.filter {
  display: flex;
  gap: 8px;
}

select,
button {
  padding: 8px;
  border: 1px solid #c9d4e5;
  border-radius: 8px;
}

button {
  background: #1f6feb;
  color: #fff;
  border-color: #1f6feb;
  cursor: pointer;
}
</style>
