<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../components/AppCard.vue";
import FlashMessage from "../components/FlashMessage.vue";
import TransactionTable from "../components/TransactionTable.vue";
import { ApiError } from "../lib/api";
import { clearAccessToken } from "../lib/session";
import { pocketfundApi } from "../services/pocketfund";
import type { Account, Fund, PagedTransactions } from "../types/api";

const router = useRouter();
const loading = ref(false);
const accounts = ref<Account[]>([]);
const funds = ref<Fund[]>([]);
const transactions = ref<PagedTransactions | null>(null);
const message = ref("");
const errorMessage = ref("");

const accountForm = reactive({
  name: "",
  type: "salary" as "salary" | "saving"
});

const fundForm = reactive({
  name: "",
  cycleDay: 1
});

const txForm = reactive({
  fundId: "",
  accountId: "",
  actionType: "top-ups" as "top-ups" | "expenses",
  amount: 0,
  description: ""
});

const queryForm = reactive({
  fundId: "",
  type: "" as "" | "TOP_UP" | "EXPENSE" | "ADJUST" | "TRANSFER",
  page: 1,
  pageSize: 20
});

const currentPageText = computed(() => {
  if (!transactions.value) return "第 1 頁";
  return `第 ${transactions.value.meta.page} 頁 / 共 ${transactions.value.meta.total} 筆`;
});

function clearFlash(): void {
  message.value = "";
  errorMessage.value = "";
}

function onError(error: unknown): void {
  const typed = error as ApiError;
  errorMessage.value = typed.message;
}

async function loadBaseData(): Promise<void> {
  loading.value = true;
  clearFlash();
  try {
    const [accountData, fundData] = await Promise.all([
      pocketfundApi.listAccounts(),
      pocketfundApi.listFunds()
    ]);
    accounts.value = accountData;
    funds.value = fundData;

    if (!txForm.accountId && accounts.value[0]) txForm.accountId = accounts.value[0].id;
    if (!txForm.fundId && funds.value[0]) txForm.fundId = funds.value[0].id;
    if (!queryForm.fundId && funds.value[0]) queryForm.fundId = funds.value[0].id;

    if (queryForm.fundId) {
      await loadTransactions();
    }
  } catch (error) {
    onError(error);
  } finally {
    loading.value = false;
  }
}

async function createAccount(): Promise<void> {
  clearFlash();
  try {
    await pocketfundApi.createAccount(accountForm.name, accountForm.type);
    message.value = "帳戶建立成功";
    accountForm.name = "";
    await loadBaseData();
  } catch (error) {
    onError(error);
  }
}

async function createFund(): Promise<void> {
  clearFlash();
  try {
    await pocketfundApi.createFund(fundForm.name, Number(fundForm.cycleDay));
    message.value = "基金建立成功";
    fundForm.name = "";
    fundForm.cycleDay = 1;
    await loadBaseData();
  } catch (error) {
    onError(error);
  }
}

async function submitTransaction(): Promise<void> {
  clearFlash();
  try {
    if (txForm.actionType === "top-ups") {
      await pocketfundApi.createTopUp(
        txForm.fundId,
        txForm.accountId,
        Number(txForm.amount),
        txForm.description || undefined
      );
    } else {
      await pocketfundApi.createExpense(
        txForm.fundId,
        txForm.accountId,
        Number(txForm.amount),
        txForm.description || undefined
      );
    }
    message.value = "交易新增成功";
    txForm.amount = 0;
    txForm.description = "";
    await loadTransactions();
  } catch (error) {
    onError(error);
  }
}

async function loadTransactions(): Promise<void> {
  if (!queryForm.fundId) return;
  clearFlash();
  try {
    transactions.value = await pocketfundApi.listFundTransactions(queryForm.fundId, {
      page: queryForm.page,
      pageSize: queryForm.pageSize,
      type: queryForm.type || undefined
    });
  } catch (error) {
    onError(error);
  }
}

async function prevPage(): Promise<void> {
  if (queryForm.page <= 1) return;
  queryForm.page -= 1;
  await loadTransactions();
}

async function nextPage(): Promise<void> {
  queryForm.page += 1;
  await loadTransactions();
}

async function logout(): Promise<void> {
  clearAccessToken();
  await router.push({ name: "login" });
}

onMounted(async () => {
  await loadBaseData();
});
</script>

<template>
  <div class="dashboard">
    <header class="top">
      <div>
        <h1>資金儀表板</h1>
        <p>Vue 3（zh-tw）前端骨架</p>
      </div>
      <div class="top-actions">
        <button type="button" @click="$router.push({ name: 'charts' })">查看基金圖表</button>
        <button @click="logout">登出</button>
      </div>
    </header>

    <FlashMessage v-if="loading" type="hint" text="載入中..." />
    <FlashMessage v-if="message" type="ok" :text="message" />
    <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />

    <div class="grid">
      <AppCard title="建立帳戶">
        <form @submit.prevent="createAccount">
          <input v-model="accountForm.name" placeholder="帳戶名稱" required />
          <select v-model="accountForm.type">
            <option value="salary">薪轉戶</option>
            <option value="saving">儲蓄戶</option>
          </select>
          <button type="submit">新增帳戶</button>
        </form>
        <ul>
          <li v-for="account in accounts" :key="account.id">
            {{ account.name }}（{{ account.type }}）
          </li>
        </ul>
      </AppCard>

      <AppCard title="建立基金">
        <form @submit.prevent="createFund">
          <input v-model="fundForm.name" placeholder="基金名稱" required />
          <input v-model.number="fundForm.cycleDay" type="number" min="1" max="31" required />
          <button type="submit">新增基金</button>
        </form>
        <ul>
          <li v-for="fund in funds" :key="fund.id">
            {{ fund.name }}（每月 {{ fund.cycle_day }} 日）
          </li>
        </ul>
      </AppCard>

      <AppCard title="新增交易">
        <form @submit.prevent="submitTransaction">
          <select v-model="txForm.fundId" required>
            <option disabled value="">請選擇基金</option>
            <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
          </select>
          <select v-model="txForm.accountId" required>
            <option disabled value="">請選擇帳戶</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </select>
          <select v-model="txForm.actionType">
            <option value="top-ups">儲值（TOP_UP）</option>
            <option value="expenses">支出（EXPENSE）</option>
          </select>
          <input v-model.number="txForm.amount" type="number" min="0.01" step="0.01" placeholder="金額" required />
          <input v-model="txForm.description" placeholder="說明（可選）" />
          <button type="submit">送出交易</button>
        </form>
      </AppCard>

      <AppCard title="交易查詢" class="wide">
        <form class="inline" @submit.prevent="loadTransactions">
          <select v-model="queryForm.fundId" required>
            <option disabled value="">請選擇基金</option>
            <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
          </select>
          <select v-model="queryForm.type">
            <option value="">全部類型</option>
            <option value="TOP_UP">TOP_UP</option>
            <option value="EXPENSE">EXPENSE</option>
            <option value="ADJUST">ADJUST</option>
          </select>
          <input v-model.number="queryForm.pageSize" type="number" min="1" max="100" />
          <button type="submit">查詢</button>
        </form>

        <div class="pager">
          <button type="button" @click="prevPage">上一頁</button>
          <span>{{ currentPageText }}</span>
          <button type="button" @click="nextPage">下一頁</button>
        </div>

        <TransactionTable :rows="transactions?.items ?? []" />
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 16px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.top h1 {
  margin: 0;
}

.top p {
  margin: 4px 0 0;
  color: #4b5563;
}

.top-actions {
  display: flex;
  gap: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.wide {
  grid-column: 1 / -1;
}

form {
  display: grid;
  gap: 8px;
}

.inline {
  grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
}

input,
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

ul {
  margin: 10px 0 0;
  padding-left: 20px;
}

.pager {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 10px 0;
}
</style>
