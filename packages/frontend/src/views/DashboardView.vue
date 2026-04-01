<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../components/AppCard.vue";
import FlashMessage from "../components/FlashMessage.vue";
import TransactionTable from "../components/TransactionTable.vue";
import UserManualModal from "../components/UserManualModal.vue";
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

const showAccountDialog = ref(false);
const showFundDialog = ref(false);
const showTxDialog = ref(false);
const showEditTxDialog = ref(false);
const showDeleteConfirm = ref(false);
const showManual = ref(false);

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

const editTxForm = reactive({
  id: "",
  type: "" as "TOP_UP" | "EXPENSE" | "TRANSFER",
  amount: 0,
  description: "",
  occurredAt: ""
});

const deletingTx = ref<{ id: string; description: string } | null>(null);

const showDeleteAccountConfirm = ref(false);
const deletingAccount = ref<{ id: string; name: string } | null>(null);

const queryForm = reactive({
  fundId: "",
  type: "" as "" | "TOP_UP" | "EXPENSE" | "TRANSFER",
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
    showAccountDialog.value = false;
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
    showFundDialog.value = false;
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
    showTxDialog.value = false;
    await loadTransactions();
  } catch (error) {
    onError(error);
  }
}

function openEditDialog(row: { id: string; type: "TOP_UP" | "EXPENSE" | "TRANSFER"; amount: string; description: string | null; occurred_at: string }): void {
  editTxForm.id = row.id;
  editTxForm.type = row.type;
  editTxForm.amount = Math.abs(Number(row.amount));
  editTxForm.description = row.description ?? "";
  editTxForm.occurredAt = row.occurred_at.slice(0, 16);
  showEditTxDialog.value = true;
}

async function saveEdit(): Promise<void> {
  clearFlash();
  try {
    await pocketfundApi.updateTransaction(editTxForm.id, {
      type: editTxForm.type || undefined,
      amount: editTxForm.amount || undefined,
      description: editTxForm.description || undefined,
      occurredAt: editTxForm.occurredAt ? new Date(editTxForm.occurredAt).toISOString() : undefined
    });
    message.value = "交易更新成功";
    showEditTxDialog.value = false;
    await loadTransactions();
  } catch (error) {
    onError(error);
  }
}

function openDeleteConfirm(row: { id: string; description: string | null }): void {
  deletingTx.value = { id: row.id, description: row.description ?? "（無說明）" };
  showDeleteConfirm.value = true;
}

async function confirmDelete(): Promise<void> {
  if (!deletingTx.value) return;
  clearFlash();
  try {
    await pocketfundApi.deleteTransaction(deletingTx.value.id);
    message.value = "交易已刪除";
    showDeleteConfirm.value = false;
    deletingTx.value = null;
    await loadTransactions();
  } catch (error) {
    onError(error);
  }
}

function openDeleteAccountConfirm(account: { id: string; name: string }): void {
  deletingAccount.value = account;
  showDeleteAccountConfirm.value = true;
}

async function confirmDeleteAccount(): Promise<void> {
  if (!deletingAccount.value) return;
  clearFlash();
  try {
    await pocketfundApi.deleteAccount(deletingAccount.value.id);
    message.value = "帳戶已刪除";
    showDeleteAccountConfirm.value = false;
    deletingAccount.value = null;
    await loadBaseData();
  } catch (error) {
    onError(error);
    showDeleteAccountConfirm.value = false;
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
        <button type="button" class="btn-secondary" @click="$router.push({ name: 'charts' })">查看基金圖表</button>
        <button type="button" class="btn-secondary" @click="showManual = true">使用手冊</button>
        <button type="button" class="btn-ghost" @click="logout">登出</button>
      </div>
    </header>

    <FlashMessage v-if="loading" type="hint" text="載入中..." />
    <FlashMessage v-if="message" type="ok" :text="message" />
    <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />

    <div class="grid">
      <!-- 帳戶卡片 -->
      <AppCard title="帳戶">
        <template #actions>
          <button type="button" class="btn-add" @click="showAccountDialog = true">＋ 新增帳戶</button>
        </template>
        <ul v-if="accounts.length" class="item-list">
          <li v-for="account in accounts" :key="account.id" class="item-row">
            <span class="item-name">{{ account.name }}</span>
            <span class="item-badge">{{ account.type === 'salary' ? '薪轉戶' : '儲蓄戶' }}</span>
            <button type="button" class="btn-icon-danger" title="刪除帳戶" @click="openDeleteAccountConfirm(account)">✕</button>
          </li>
        </ul>
        <p v-else class="empty-hint">尚無帳戶，請新增一個。</p>
      </AppCard>

      <!-- 基金卡片 -->
      <AppCard title="基金">
        <template #actions>
          <button type="button" class="btn-add" @click="showFundDialog = true">＋ 新增基金</button>
        </template>
        <ul v-if="funds.length" class="item-list">
          <li v-for="fund in funds" :key="fund.id" class="item-row">
            <span class="item-name">{{ fund.name }}</span>
            <span class="item-badge">每月 {{ fund.cycle_day }} 日</span>
          </li>
        </ul>
        <p v-else class="empty-hint">尚無基金，請新增一個。</p>
      </AppCard>

      <!-- 交易查詢 -->
      <AppCard title="交易查詢" class="wide">
        <template #actions>
          <button type="button" class="btn-add" @click="showTxDialog = true">＋ 新增交易</button>
        </template>
        <form class="inline" @submit.prevent="loadTransactions">
          <select v-model="queryForm.fundId" required>
            <option disabled value="">請選擇基金</option>
            <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
          </select>
          <select v-model="queryForm.type">
            <option value="">全部類型</option>
            <option value="TOP_UP">儲值</option>
            <option value="EXPENSE">支出</option>
            <option value="ADJUST">調整</option>
            <option value="TRANSFER">轉帳</option>
          </select>
          <input v-model.number="queryForm.pageSize" type="number" min="1" max="100" />
          <button type="submit">查詢</button>
        </form>

        <div class="pager">
          <button type="button" class="btn-ghost" @click="prevPage">← 上一頁</button>
          <span class="pager-text">{{ currentPageText }}</span>
          <button type="button" class="btn-ghost" @click="nextPage">下一頁 →</button>
        </div>

        <TransactionTable
          :rows="transactions?.items ?? []"
          @edit="openEditDialog"
          @delete="openDeleteConfirm"
        />
      </AppCard>
    </div>

    <!-- Dialog: 建立帳戶 -->
    <Teleport to="body">
      <div v-if="showAccountDialog" class="dialog-backdrop" @click.self="showAccountDialog = false">
        <div class="dialog">
          <div class="dialog-head">
            <h3>建立帳戶</h3>
            <button type="button" class="btn-close" @click="showAccountDialog = false">✕</button>
          </div>
          <form @submit.prevent="createAccount">
            <label class="field">
              <span>帳戶名稱</span>
              <input v-model="accountForm.name" placeholder="例：玉山薪轉戶" required />
            </label>
            <label class="field">
              <span>帳戶類型</span>
              <select v-model="accountForm.type">
                <option value="salary">薪轉戶</option>
                <option value="saving">儲蓄戶</option>
              </select>
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn-ghost" @click="showAccountDialog = false">取消</button>
              <button type="submit">建立帳戶</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: 建立基金 -->
    <Teleport to="body">
      <div v-if="showFundDialog" class="dialog-backdrop" @click.self="showFundDialog = false">
        <div class="dialog">
          <div class="dialog-head">
            <h3>建立基金</h3>
            <button type="button" class="btn-close" @click="showFundDialog = false">✕</button>
          </div>
          <form @submit.prevent="createFund">
            <label class="field">
              <span>基金名稱</span>
              <input v-model="fundForm.name" placeholder="例：生活費" required />
            </label>
            <label class="field">
              <span>每月補充日（1–31）</span>
              <input v-model.number="fundForm.cycleDay" type="number" min="1" max="31" required />
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn-ghost" @click="showFundDialog = false">取消</button>
              <button type="submit">建立基金</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: 編輯交易 -->
    <Teleport to="body">
      <div v-if="showEditTxDialog" class="dialog-backdrop" @click.self="showEditTxDialog = false">
        <div class="dialog">
          <div class="dialog-head">
            <h3>編輯交易</h3>
            <button type="button" class="btn-close" @click="showEditTxDialog = false">✕</button>
          </div>
          <form @submit.prevent="saveEdit">
            <label class="field">
              <span>交易類型</span>
              <select v-model="editTxForm.type" required>
                <option value="TOP_UP">儲值</option>
                <option value="EXPENSE">支出</option>
                  <option value="TRANSFER">轉帳</option>
              </select>
            </label>
            <label class="field">
              <span>金額</span>
              <input v-model.number="editTxForm.amount" type="number" min="0" step="1" required />
            </label>
            <label class="field">
              <span>說明</span>
              <input v-model="editTxForm.description" placeholder="例：三月份薪水" />
            </label>
            <label class="field">
              <span>交易時間</span>
              <input v-model="editTxForm.occurredAt" type="datetime-local" />
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn-ghost" @click="showEditTxDialog = false">取消</button>
              <button type="submit">儲存變更</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Confirm: 刪除交易 -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="dialog-backdrop" @click.self="showDeleteConfirm = false">
        <div class="dialog dialog-sm">
          <div class="dialog-head">
            <h3>確認刪除</h3>
            <button type="button" class="btn-close" @click="showDeleteConfirm = false">✕</button>
          </div>
          <p class="confirm-text">
            確定要刪除這筆交易嗎？<br />
            <span class="confirm-desc">{{ deletingTx?.description }}</span>
          </p>
          <div class="dialog-footer">
            <button type="button" class="btn-ghost" @click="showDeleteConfirm = false">取消</button>
            <button type="button" class="btn-danger" @click="confirmDelete">確認刪除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 使用手冊 -->
    <UserManualModal v-model="showManual" />

    <!-- Confirm: 刪除帳戶 -->
    <Teleport to="body">
      <div v-if="showDeleteAccountConfirm" class="dialog-backdrop" @click.self="showDeleteAccountConfirm = false">
        <div class="dialog dialog-sm">
          <div class="dialog-head">
            <h3>確認刪除帳戶</h3>
            <button type="button" class="btn-close" @click="showDeleteAccountConfirm = false">✕</button>
          </div>
          <p class="confirm-text">
            確定要刪除帳戶 <strong>{{ deletingAccount?.name }}</strong> 嗎？<br />
            <span class="confirm-desc">若該帳戶已有交易或排程紀錄，將無法刪除。</span>
          </p>
          <div class="dialog-footer">
            <button type="button" class="btn-ghost" @click="showDeleteAccountConfirm = false">取消</button>
            <button type="button" class="btn-danger" @click="confirmDeleteAccount">確認刪除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: 新增交易 -->
    <Teleport to="body">
      <div v-if="showTxDialog" class="dialog-backdrop" @click.self="showTxDialog = false">
        <div class="dialog">
          <div class="dialog-head">
            <h3>新增交易</h3>
            <button type="button" class="btn-close" @click="showTxDialog = false">✕</button>
          </div>
          <form @submit.prevent="submitTransaction">
            <label class="field">
              <span>基金</span>
              <select v-model="txForm.fundId" required>
                <option disabled value="">請選擇基金</option>
                <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>帳戶</span>
              <select v-model="txForm.accountId" required>
                <option disabled value="">請選擇帳戶</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>交易類型</span>
              <select v-model="txForm.actionType">
                <option value="top-ups">儲值</option>
                <option value="expenses">支出</option>
              </select>
            </label>
            <label class="field">
              <span>金額</span>
              <input v-model.number="txForm.amount" type="number" min="0" step="1" placeholder="0" required />
            </label>
            <label class="field">
              <span>說明（可選）</span>
              <input v-model="txForm.description" placeholder="例：三月份薪水" />
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn-ghost" @click="showTxDialog = false">取消</button>
              <button type="submit">送出交易</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Header ── */
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.top h1 {
  margin: 0;
  font-size: 28px;
}

.top p {
  margin: 4px 0 0;
  color: var(--text-muted-color);
}

.top-actions {
  display: flex;
  gap: 12px;
}

/* ── Grid ── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.wide {
  grid-column: 1 / -1;
}

/* ── Buttons ── */
button {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 12px);
  background: var(--primary-color);
  color: var(--primary-contrast);
  border-color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: var(--transition-fast);
}

button:hover {
  filter: brightness(0.95);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted-color);
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--surface-color);
  color: var(--text-color);
}

.btn-add {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: var(--radius-md, 8px);
}

/* ── Item list inside cards ── */
.item-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 10px);
}

.item-name {
  font-weight: 500;
}

.item-badge {
  font-size: 12px;
  color: var(--text-muted-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: 99px;
}

.empty-hint {
  margin: 12px 0 0;
  color: var(--text-muted-color);
  font-size: 14px;
}

/* ── Query form ── */
form.inline {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
  gap: 12px;
  align-items: center;
}

input,
select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 12px);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: 14px;
}

/* ── Pager ── */
.pager {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
}

.pager-text {
  color: var(--text-muted-color);
  font-size: 14px;
}

/* ── Dialog ── */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}

.dialog {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 16px);
  padding: 28px;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-head h3 {
  margin: 0;
  font-size: 18px;
}

.btn-close {
  background: transparent;
  border-color: transparent;
  color: var(--text-muted-color);
  padding: 4px 8px;
  font-size: 16px;
}

.btn-close:hover {
  background: var(--surface-color);
  color: var(--text-color);
}

.dialog form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: var(--text-muted-color);
}

.field input,
.field select {
  width: 100%;
  box-sizing: border-box;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.dialog-sm {
  max-width: 360px;
}

.confirm-text {
  margin: 0;
  line-height: 1.6;
  color: var(--text-color);
}

.confirm-desc {
  color: var(--text-muted-color);
  font-size: 13px;
}

.btn-danger {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  filter: brightness(0.9);
}

.btn-icon-danger {
  background: transparent;
  border-color: transparent;
  color: var(--text-muted-color);
  padding: 2px 6px;
  font-size: 12px;
  margin-left: auto;
}

.btn-icon-danger:hover {
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #ef4444;
  border-color: transparent;
  box-shadow: none;
  filter: none;
}
</style>
