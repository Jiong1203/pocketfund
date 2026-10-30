<template>
  <div class="page dashboard">
    <header class="page-head">
      <h1>資金儀表板</h1>
      <p>掌握每個基金還剩多少錢、花到哪裡去</p>
    </header>

    <FlashMessage v-if="loading" type="hint" text="載入中..." />
    <FlashMessage v-if="message" type="ok" :text="message" />
    <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />

    <div class="grid">
      <!-- 基金卡片 -->
      <AppCard title="基金" class="funds-card">
        <template #actions>
          <button type="button" class="btn btn-sm" @click="showFundDialog = true"><AppIcon name="plus" :size="16" />新增基金</button>
        </template>
        <div v-if="funds.length" class="total">
          <span class="total-label">基金總餘額</span>
          <span class="total-amount money" :class="{ expense: totalBalance < 0 }">{{ formatMoney(totalBalance) }}</span>
        </div>
        <ul v-if="funds.length" class="item-list">
          <li v-for="fund in funds" :key="fund.id">
            <button
              type="button"
              class="item-row fund-row"
              :class="{ selected: fund.id === queryForm.fundId }"
              :aria-pressed="fund.id === queryForm.fundId"
              @click="selectFund(fund.id)"
            >
              <span class="fund-info">
                <span class="item-name">{{ fund.name }}</span>
                <span class="item-sub">每月 {{ fund.cycle_day }} 日補充</span>
              </span>
              <span class="fund-balance money" :class="{ expense: fund.balance < 0 }">{{ formatMoney(fund.balance) }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="empty-hint">尚無基金，請先新增一個，例如「生活費」。</p>
      </AppCard>

      <!-- 帳戶卡片 -->
      <AppCard title="帳戶" class="accounts-card">
        <template #actions>
          <button type="button" class="btn btn-sm btn-secondary" @click="showAccountDialog = true"><AppIcon name="plus" :size="16" />新增帳戶</button>
        </template>
        <ul v-if="accounts.length" class="item-list">
          <li v-for="account in accounts" :key="account.id" class="item-row">
            <span class="item-name">{{ account.name }}</span>
            <span class="item-badge">{{ account.type === 'salary' ? '薪轉戶' : '儲蓄戶' }}</span>
            <button type="button" class="btn btn-icon danger" title="刪除帳戶" :aria-label="`刪除帳戶 ${account.name}`" @click="openDeleteAccountConfirm(account)">
              <AppIcon name="trash" :size="16" />
            </button>
          </li>
        </ul>
        <p v-else class="empty-hint">尚無帳戶，請新增錢實際存放的地方，例如「玉山薪轉戶」。</p>
      </AppCard>

      <!-- 交易紀錄 -->
      <AppCard :title="selectedFund ? `交易紀錄：${selectedFund.name}` : '交易紀錄'" class="wide">
        <template #actions>
          <button type="button" class="btn btn-sm" :disabled="!funds.length || !accounts.length" @click="openTxDialog"><AppIcon name="plus" :size="16" />新增交易</button>
        </template>
        <div class="filters">
          <label class="filter">
            <span>基金</span>
            <select v-model="queryForm.fundId">
              <option disabled value="">請選擇基金</option>
              <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
            </select>
          </label>
          <label class="filter">
            <span>類型</span>
            <select v-model="queryForm.type">
              <option value="">全部類型</option>
              <option value="TOP_UP">儲值</option>
              <option value="EXPENSE">支出</option>
              <option value="TRANSFER">轉帳</option>
            </select>
          </label>
          <label class="filter">
            <span>每頁筆數</span>
            <select v-model.number="queryForm.pageSize">
              <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }} 筆</option>
            </select>
          </label>
        </div>

        <TransactionTable
          :rows="transactions?.items ?? []"
          :empty-text="queryForm.type ? '這個條件下沒有交易紀錄' : '這個基金還沒有交易，按「新增交易」記第一筆吧'"
          @edit="openEditDialog"
          @delete="openDeleteConfirm"
        />

        <div v-if="totalPages > 1" class="pager">
          <button type="button" class="btn btn-ghost" :disabled="queryForm.page <= 1" @click="goToPage(queryForm.page - 1)"><AppIcon name="chevronLeft" :size="16" />上一頁</button>
          <span class="pager-text">{{ pagerText }}</span>
          <button type="button" class="btn btn-ghost" :disabled="queryForm.page >= totalPages" @click="goToPage(queryForm.page + 1)">下一頁<AppIcon name="chevronRight" :size="16" /></button>
        </div>
        <p v-else-if="transactions && transactions.meta.total > 0" class="pager-text">共 {{ transactions.meta.total }} 筆</p>
      </AppCard>
    </div>

    <!-- Dialog: 建立帳戶 -->
    <Teleport to="body">
      <div v-if="showAccountDialog" class="dialog-backdrop" @click.self="showAccountDialog = false">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
          <div class="dialog-head">
            <h3 id="account-dialog-title">建立帳戶</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showAccountDialog = false"><AppIcon name="close" /></button>
          </div>
          <form @submit.prevent="createAccount">
            <label class="field">
              <span>帳戶名稱</span>
              <input v-model.trim="accountForm.name" placeholder="例：玉山薪轉戶" required />
            </label>
            <label class="field">
              <span>帳戶類型</span>
              <select v-model="accountForm.type">
                <option value="salary">薪轉戶</option>
                <option value="saving">儲蓄戶</option>
              </select>
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn btn-ghost" @click="showAccountDialog = false">取消</button>
              <button type="submit" class="btn" :disabled="submitting">{{ submitting ? "處理中..." : "建立帳戶" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: 建立基金 -->
    <Teleport to="body">
      <div v-if="showFundDialog" class="dialog-backdrop" @click.self="showFundDialog = false">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="fund-dialog-title">
          <div class="dialog-head">
            <h3 id="fund-dialog-title">建立基金</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showFundDialog = false"><AppIcon name="close" /></button>
          </div>
          <form @submit.prevent="createFund">
            <label class="field">
              <span>基金名稱</span>
              <input v-model.trim="fundForm.name" placeholder="例：生活費" required />
            </label>
            <label class="field">
              <span>每月補充日（1–31）</span>
              <input v-model.number="fundForm.cycleDay" type="number" min="1" max="31" required />
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn btn-ghost" @click="showFundDialog = false">取消</button>
              <button type="submit" class="btn" :disabled="submitting">{{ submitting ? "處理中..." : "建立基金" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: 編輯交易 -->
    <Teleport to="body">
      <div v-if="showEditTxDialog" class="dialog-backdrop" @click.self="showEditTxDialog = false">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
          <div class="dialog-head">
            <h3 id="edit-dialog-title">編輯交易</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showEditTxDialog = false"><AppIcon name="close" /></button>
          </div>
          <form @submit.prevent="saveEdit">
            <label class="field">
              <span>交易日期</span>
              <input v-model="editTxForm.occurredDate" type="date" required />
            </label>
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
              <input v-model.number="editTxForm.amount" type="number" min="1" step="1" inputmode="numeric" required />
            </label>
            <label class="field">
              <span>說明</span>
              <input v-model.trim="editTxForm.description" placeholder="例：三月份薪水" />
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn btn-ghost" @click="showEditTxDialog = false">取消</button>
              <button type="submit" class="btn" :disabled="submitting">{{ submitting ? "處理中..." : "儲存變更" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Confirm: 刪除交易 -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="dialog-backdrop" @click.self="showDeleteConfirm = false">
        <div class="dialog dialog-sm" role="alertdialog" aria-modal="true" aria-labelledby="delete-tx-title">
          <div class="dialog-head">
            <h3 id="delete-tx-title">確認刪除</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showDeleteConfirm = false"><AppIcon name="close" /></button>
          </div>
          <p class="confirm-text">
            確定要刪除這筆交易嗎？<br />
            <span class="confirm-desc">{{ deletingTx?.description }}</span>
          </p>
          <div class="dialog-footer">
            <button type="button" class="btn btn-ghost" @click="showDeleteConfirm = false">取消</button>
            <button type="button" class="btn btn-danger" :disabled="submitting" @click="confirmDelete">{{ submitting ? "處理中..." : "確認刪除" }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm: 刪除帳戶 -->
    <Teleport to="body">
      <div v-if="showDeleteAccountConfirm" class="dialog-backdrop" @click.self="showDeleteAccountConfirm = false">
        <div class="dialog dialog-sm" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div class="dialog-head">
            <h3 id="delete-account-title">確認刪除帳戶</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showDeleteAccountConfirm = false"><AppIcon name="close" /></button>
          </div>
          <p class="confirm-text">
            確定要刪除帳戶 <strong>{{ deletingAccount?.name }}</strong> 嗎？<br />
            <span class="confirm-desc">若該帳戶已有交易或排程紀錄，將無法刪除。</span>
          </p>
          <div class="dialog-footer">
            <button type="button" class="btn btn-ghost" @click="showDeleteAccountConfirm = false">取消</button>
            <button type="button" class="btn btn-danger" :disabled="submitting" @click="confirmDeleteAccount">{{ submitting ? "處理中..." : "確認刪除" }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Dialog: 新增交易 -->
    <Teleport to="body">
      <div v-if="showTxDialog" class="dialog-backdrop" @click.self="showTxDialog = false">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="tx-dialog-title">
          <div class="dialog-head">
            <h3 id="tx-dialog-title">新增交易</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showTxDialog = false"><AppIcon name="close" /></button>
          </div>
          <form @submit.prevent="submitTransaction">
            <div class="segmented" role="radiogroup" aria-label="交易類型">
              <button
                type="button"
                role="radio"
                :aria-checked="txForm.actionType === 'expenses'"
                :class="{ active: txForm.actionType === 'expenses' }"
                @click="txForm.actionType = 'expenses'"
              >支出</button>
              <button
                type="button"
                role="radio"
                :aria-checked="txForm.actionType === 'top-ups'"
                :class="{ active: txForm.actionType === 'top-ups' }"
                @click="txForm.actionType = 'top-ups'"
              >儲值</button>
            </div>
            <label class="field">
              <span>金額</span>
              <input v-model.number="txForm.amount" type="number" min="1" step="1" inputmode="numeric" placeholder="0" required />
            </label>
            <label class="field">
              <span>基金</span>
              <select v-model="txForm.fundId" required>
                <option disabled value="">請選擇基金</option>
                <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}（餘額 {{ formatMoney(fund.balance) }}）</option>
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
              <span>交易日期</span>
              <input v-model="txForm.occurredAt" type="date" required />
            </label>
            <label class="field">
              <span>說明（可選）</span>
              <input v-model.trim="txForm.description" :placeholder="txForm.actionType === 'expenses' ? '例：午餐' : '例：三月份薪水'" />
            </label>
            <div class="dialog-footer">
              <button type="button" class="btn btn-ghost" @click="showTxDialog = false">取消</button>
              <button type="submit" class="btn" :disabled="submitting">{{ submitting ? "處理中..." : "送出交易" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import AppCard from "../components/AppCard.vue";
import AppIcon from "../components/AppIcon.vue";
import FlashMessage from "../components/FlashMessage.vue";
import TransactionTable from "../components/TransactionTable.vue";
import { ApiError } from "../lib/api";
import { formatMoney, toLocalDateInput, todayLocalDate } from "../lib/format";
import { pocketfundApi } from "../services/pocketfund";
import type { Account, Fund, PagedTransactions, TransactionRecord } from "../types/api";

const PAGE_SIZES = [10, 20, 50];
const FLASH_DURATION_MS = 3000;

const loading = ref(false);
const submitting = ref(false);
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
  actionType: "expenses" as "top-ups" | "expenses",
  amount: null as number | null,
  description: "",
  occurredAt: todayLocalDate()
});

// `original` keeps the loaded row so only the fields the user actually changed are sent.
const editTxForm = reactive({
  id: "",
  type: "TOP_UP" as TransactionRecord["type"],
  amount: 0,
  description: "",
  occurredDate: "",
  original: null as TransactionRecord | null
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

const totalBalance = computed(() => funds.value.reduce((sum, fund) => sum + fund.balance, 0));
const selectedFund = computed(() => funds.value.find((fund) => fund.id === queryForm.fundId));

const totalPages = computed(() => {
  if (!transactions.value) return 1;
  const { total, pageSize } = transactions.value.meta;
  return Math.max(1, Math.ceil(total / pageSize));
});

const pagerText = computed(() => {
  if (!transactions.value) return "";
  return `第 ${queryForm.page} / ${totalPages.value} 頁（共 ${transactions.value.meta.total} 筆）`;
});

let flashTimer: ReturnType<typeof setTimeout> | undefined;

function showSuccess(text: string): void {
  message.value = text;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    message.value = "";
  }, FLASH_DURATION_MS);
}

function clearFlash(): void {
  message.value = "";
  errorMessage.value = "";
}

function onError(error: unknown): void {
  errorMessage.value = error instanceof ApiError ? error.message : "系統發生錯誤，請稍後再試。";
}

// Wraps a write so the button shows a pending state and a double click cannot submit twice.
async function runSubmit(action: () => Promise<void>): Promise<void> {
  if (submitting.value) return;
  submitting.value = true;
  clearFlash();
  try {
    await action();
  } catch (error) {
    onError(error);
  } finally {
    submitting.value = false;
  }
}

async function loadFunds(): Promise<void> {
  funds.value = await pocketfundApi.listFunds();
}

async function loadBaseData(): Promise<void> {
  loading.value = true;
  clearFlash();
  try {
    const [accountData] = await Promise.all([pocketfundApi.listAccounts(), loadFunds()]);
    accounts.value = accountData;

    if (!queryForm.fundId && funds.value[0]) {
      queryForm.fundId = funds.value[0].id; // the watcher loads its transactions
    } else {
      await loadTransactions();
    }
  } catch (error) {
    onError(error);
  } finally {
    loading.value = false;
  }
}

// Balances change with every ledger write, so refresh them together with the list.
async function refreshAfterLedgerWrite(): Promise<void> {
  await Promise.all([loadFunds(), loadTransactions()]);
}

function createAccount(): Promise<void> {
  return runSubmit(async () => {
    await pocketfundApi.createAccount(accountForm.name, accountForm.type);
    accountForm.name = "";
    showAccountDialog.value = false;
    accounts.value = await pocketfundApi.listAccounts();
    showSuccess("帳戶建立成功");
  });
}

function createFund(): Promise<void> {
  return runSubmit(async () => {
    const fund = await pocketfundApi.createFund(fundForm.name, Number(fundForm.cycleDay));
    fundForm.name = "";
    fundForm.cycleDay = 1;
    showFundDialog.value = false;
    await loadFunds();
    if (!queryForm.fundId) queryForm.fundId = fund.id;
    showSuccess("基金建立成功");
  });
}

function selectFund(fundId: string): void {
  queryForm.fundId = fundId;
}

function openTxDialog(): void {
  txForm.fundId = queryForm.fundId || funds.value[0]?.id || "";
  if (!txForm.accountId || !accounts.value.some((account) => account.id === txForm.accountId)) {
    txForm.accountId = accounts.value[0]?.id ?? "";
  }
  showTxDialog.value = true;
}

function submitTransaction(): Promise<void> {
  return runSubmit(async () => {
    const amount = Number(txForm.amount);
    const occurredAt = new Date(`${txForm.occurredAt}T00:00:00`).toISOString();
    const description = txForm.description || undefined;
    if (txForm.actionType === "top-ups") {
      await pocketfundApi.createTopUp(txForm.fundId, txForm.accountId, amount, description, occurredAt);
    } else {
      await pocketfundApi.createExpense(txForm.fundId, txForm.accountId, amount, description, occurredAt);
    }
    txForm.amount = null;
    txForm.description = "";
    txForm.occurredAt = todayLocalDate();
    showTxDialog.value = false;
    await refreshAfterLedgerWrite();
    showSuccess("交易新增成功");
  });
}

function openEditDialog(row: TransactionRecord): void {
  editTxForm.id = row.id;
  editTxForm.type = row.type;
  editTxForm.amount = Math.abs(Number(row.amount));
  editTxForm.description = row.description ?? "";
  editTxForm.occurredDate = toLocalDateInput(row.occurred_at);
  editTxForm.original = row;
  showEditTxDialog.value = true;
}

function saveEdit(): Promise<void> {
  return runSubmit(async () => {
    const original = editTxForm.original;
    if (!original) return;

    const changes: { type?: string; amount?: number; description?: string; occurredAt?: string } = {};
    if (editTxForm.type !== original.type) changes.type = editTxForm.type;
    if (editTxForm.amount !== Math.abs(Number(original.amount))) changes.amount = editTxForm.amount;
    if (editTxForm.description !== (original.description ?? "")) changes.description = editTxForm.description;
    // Only touch occurred_at when the date changed, so the original time of day is kept otherwise.
    if (editTxForm.occurredDate !== toLocalDateInput(original.occurred_at)) {
      changes.occurredAt = new Date(`${editTxForm.occurredDate}T00:00:00`).toISOString();
    }

    if (Object.keys(changes).length === 0) {
      showEditTxDialog.value = false;
      return;
    }

    await pocketfundApi.updateTransaction(editTxForm.id, changes);
    showEditTxDialog.value = false;
    await refreshAfterLedgerWrite();
    showSuccess("交易更新成功");
  });
}

function openDeleteConfirm(row: TransactionRecord): void {
  deletingTx.value = { id: row.id, description: row.description ?? "（無說明）" };
  showDeleteConfirm.value = true;
}

function confirmDelete(): Promise<void> {
  return runSubmit(async () => {
    if (!deletingTx.value) return;
    await pocketfundApi.deleteTransaction(deletingTx.value.id);
    showDeleteConfirm.value = false;
    deletingTx.value = null;
    await refreshAfterLedgerWrite();
    showSuccess("交易已刪除");
  });
}

function openDeleteAccountConfirm(account: { id: string; name: string }): void {
  deletingAccount.value = account;
  showDeleteAccountConfirm.value = true;
}

function confirmDeleteAccount(): Promise<void> {
  return runSubmit(async () => {
    if (!deletingAccount.value) return;
    try {
      await pocketfundApi.deleteAccount(deletingAccount.value.id);
      deletingAccount.value = null;
      accounts.value = await pocketfundApi.listAccounts();
      showSuccess("帳戶已刪除");
    } finally {
      showDeleteAccountConfirm.value = false;
    }
  });
}

async function loadTransactions(): Promise<void> {
  if (!queryForm.fundId) return;
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

async function goToPage(page: number): Promise<void> {
  queryForm.page = page;
  await loadTransactions();
}

// Changing any filter starts again from page 1.
watch(
  () => [queryForm.fundId, queryForm.type, queryForm.pageSize],
  async () => {
    queryForm.page = 1;
    await loadTransactions();
  }
);

onMounted(async () => {
  await loadBaseData();
});
</script>

<style scoped>
.page-head {
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

/* ── Grid ── */
.grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 20px;
  align-items: start;
}

.wide {
  grid-column: 1 / -1;
}

/* ── Fund total ── */
.total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin: 0 0 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--primary-soft-color);
}

.total-label {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
}

.total-amount {
  font-size: 28px;
  font-weight: 700;
}

/* ── Item lists inside cards ── */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 8px 8px 8px 14px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.fund-row {
  width: 100%;
  padding-right: 14px;
  color: var(--text-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
}

.fund-row:hover {
  border-color: var(--border-strong-color);
}

.fund-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring-color);
}

.fund-row.selected {
  border-color: var(--primary-color);
  box-shadow: inset 4px 0 0 var(--primary-color);
}

.fund-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub {
  font-size: 12px;
  color: var(--text-muted-color);
}

.fund-balance {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

.item-badge {
  margin-right: auto;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--surface-muted-color);
  color: var(--text-muted-color);
  font-size: 12px;
  white-space: nowrap;
}

.empty-hint {
  margin: 4px 0 0;
  color: var(--text-muted-color);
  font-size: 14px;
}

/* ── Filters ── */
.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted-color);
}

.filter select {
  width: 100%;
}

/* ── Pager ── */
.pager {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
}

.pager-text {
  margin: 12px 0 0;
  color: var(--text-muted-color);
  font-size: 14px;
  text-align: center;
}

.pager .pager-text {
  margin: 0;
}

/* ── Dialog extras ── */
.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  background: var(--surface-muted-color);
  border-radius: var(--radius-md);
}

.segmented button {
  min-height: 40px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted-color);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.segmented button.active {
  background: var(--surface-color);
  color: var(--text-color);
  box-shadow: var(--shadow-sm);
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

/* ── Responsive ── */
@media (max-width: 860px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .page-head h1 {
    font-size: 22px;
  }

  .grid {
    gap: 16px;
  }

  .total-amount {
    font-size: 24px;
  }

  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters .filter:first-child {
    grid-column: 1 / -1;
  }

  .pager {
    justify-content: space-between;
  }
}
</style>
