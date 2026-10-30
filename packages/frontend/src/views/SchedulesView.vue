<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>自動儲值</h1>
        <p>每月固定日期，自動把錢從帳戶存進基金</p>
      </div>
      <button type="button" class="btn" :disabled="!canCreate" @click="openCreateDialog">
        <AppIcon name="plus" :size="16" />新增自動儲值
      </button>
    </header>

    <FlashMessage v-if="message" type="ok" :text="message" />
    <FlashMessage v-if="errorMessage" type="err" :text="errorMessage" />
    <FlashMessage v-if="!loading && !canCreate" type="hint" text="請先到儀表板建立至少一個基金和一個帳戶，才能設定自動儲值。" />

    <div v-if="schedules.length" class="summary">
      <span>每月自動存入合計</span>
      <strong class="money">{{ formatMoney(monthlyTotal) }}</strong>
      <span class="summary-sub">啟用中 {{ activeCount }} / {{ schedules.length }} 筆</span>
    </div>

    <p v-if="loading" class="loading">載入中...</p>

    <ul v-else-if="schedules.length" class="schedule-list">
      <li v-for="schedule in schedules" :key="schedule.id" class="schedule" :class="{ paused: !schedule.is_active }">
        <div class="schedule-main">
          <div class="schedule-title">
            <span class="fund-name">{{ fundName(schedule.fund_id) }}</span>
            <span v-if="!schedule.is_active" class="badge">已暫停</span>
          </div>
          <span class="schedule-meta">每月 {{ schedule.cycle_day }} 日・從 {{ accountName(schedule.account_id) }}</span>
          <span v-if="schedule.description" class="schedule-meta">{{ schedule.description }}</span>
          <span class="schedule-next">
            {{ schedule.is_active ? `下次執行：${formatDate(nextRunDate(schedule.cycle_day))}` : "暫停中，不會自動存入" }}
          </span>
        </div>

        <div class="schedule-side">
          <span class="money income amount">+{{ formatMoney(Number(schedule.amount)) }}</span>
          <div class="schedule-actions">
            <button
              type="button"
              class="switch"
              role="switch"
              :aria-checked="schedule.is_active"
              :aria-label="`${schedule.is_active ? '暫停' : '啟用'}「${fundName(schedule.fund_id)}」的自動儲值`"
              :disabled="busyId === schedule.id"
              @click="toggleActive(schedule)"
            >
              <span class="switch-thumb" />
            </button>
            <button type="button" class="btn btn-icon" title="編輯" aria-label="編輯自動儲值" @click="openEditDialog(schedule)">
              <AppIcon name="edit" :size="16" />
            </button>
            <button type="button" class="btn btn-icon danger" title="刪除" aria-label="刪除自動儲值" @click="deleting = schedule">
              <AppIcon name="trash" :size="16" />
            </button>
          </div>
        </div>
      </li>
    </ul>

    <AppCard v-else-if="canCreate">
      <div class="empty">
        <AppIcon name="repeat" :size="32" />
        <p>還沒有自動儲值。<br />例如每月 5 日發薪後，自動從薪轉戶存 15,000 到「生活費」。</p>
        <button type="button" class="btn" @click="openCreateDialog">
          <AppIcon name="plus" :size="16" />新增第一筆自動儲值
        </button>
      </div>
    </AppCard>

    <!-- Dialog: 新增 / 編輯 -->
    <Teleport to="body">
      <div v-if="showDialog" class="dialog-backdrop" @click.self="showDialog = false">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title">
          <div class="dialog-head">
            <h3 id="schedule-dialog-title">{{ form.id ? "編輯自動儲值" : "新增自動儲值" }}</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="showDialog = false"><AppIcon name="close" /></button>
          </div>
          <form @submit.prevent="save">
            <label class="field">
              <span>存入基金</span>
              <select v-model="form.fundId" :disabled="Boolean(form.id)" required @change="onFundChange">
                <option disabled value="">請選擇基金</option>
                <option v-for="fund in funds" :key="fund.id" :value="fund.id">{{ fund.name }}</option>
              </select>
              <small v-if="form.id" class="field-hint">建立後無法更換基金；如需更換，請刪除後重新建立。</small>
            </label>
            <label class="field">
              <span>從哪個帳戶</span>
              <select v-model="form.accountId" required>
                <option disabled value="">請選擇帳戶</option>
                <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </label>
            <div class="field-row">
              <label class="field">
                <span>每月金額</span>
                <input v-model.number="form.amount" type="number" min="1" step="1" inputmode="numeric" placeholder="0" required />
              </label>
              <label class="field">
                <span>每月幾號</span>
                <select v-model.number="form.cycleDay" required>
                  <option v-for="day in 31" :key="day" :value="day">{{ day }} 日</option>
                </select>
              </label>
            </div>
            <label class="field">
              <span>說明（可選）</span>
              <input v-model.trim="form.description" maxlength="255" placeholder="例：每月生活費" />
            </label>
            <p class="dialog-note">
              每天台灣時間早上 8 點左右執行。若當月沒有這一天（例如 31 日），會在當月最後一天存入。
            </p>
            <div class="dialog-footer">
              <button type="button" class="btn btn-ghost" @click="showDialog = false">取消</button>
              <button type="submit" class="btn" :disabled="submitting">{{ submitting ? "處理中..." : form.id ? "儲存變更" : "建立" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Confirm: 刪除 -->
    <Teleport to="body">
      <div v-if="deleting" class="dialog-backdrop" @click.self="deleting = null">
        <div class="dialog dialog-sm" role="alertdialog" aria-modal="true" aria-labelledby="delete-schedule-title">
          <div class="dialog-head">
            <h3 id="delete-schedule-title">刪除自動儲值</h3>
            <button type="button" class="btn btn-icon" aria-label="關閉" @click="deleting = null"><AppIcon name="close" /></button>
          </div>
          <p class="confirm-text">
            確定要刪除「{{ fundName(deleting.fund_id) }}」每月 {{ formatMoney(Number(deleting.amount)) }} 的自動儲值嗎？<br />
            <span class="confirm-desc">之前已經自動存入的交易會保留，不會被刪除。若只是暫時不需要，可以改用開關暫停。</span>
          </p>
          <div class="dialog-footer">
            <button type="button" class="btn btn-ghost" @click="deleting = null">取消</button>
            <button type="button" class="btn btn-danger" :disabled="submitting" @click="confirmDelete">{{ submitting ? "處理中..." : "確認刪除" }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AppCard from "../components/AppCard.vue";
import AppIcon from "../components/AppIcon.vue";
import FlashMessage from "../components/FlashMessage.vue";
import { ApiError } from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import { pocketfundApi } from "../services/pocketfund";
import type { Account, Fund, ScheduledTopUp } from "../types/api";

const FLASH_DURATION_MS = 3000;
// The cron trigger runs daily at 00:05 UTC (see cloudflare.config.ts).
const RUN_HOUR_UTC = 0;
const RUN_MINUTE_UTC = 5;

const loading = ref(true);
const submitting = ref(false);
const busyId = ref("");
const schedules = ref<ScheduledTopUp[]>([]);
const funds = ref<Fund[]>([]);
const accounts = ref<Account[]>([]);
const message = ref("");
const errorMessage = ref("");
const showDialog = ref(false);
const deleting = ref<ScheduledTopUp | null>(null);

const form = reactive({
  id: "",
  fundId: "",
  accountId: "",
  amount: null as number | null,
  cycleDay: 1,
  description: ""
});

const canCreate = computed(() => funds.value.length > 0 && accounts.value.length > 0);
const activeCount = computed(() => schedules.value.filter((schedule) => schedule.is_active).length);
const monthlyTotal = computed(() =>
  schedules.value.filter((schedule) => schedule.is_active).reduce((sum, schedule) => sum + Number(schedule.amount), 0)
);

let flashTimer: ReturnType<typeof setTimeout> | undefined;

function showSuccess(text: string): void {
  message.value = text;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    message.value = "";
  }, FLASH_DURATION_MS);
}

function onError(error: unknown): void {
  errorMessage.value = error instanceof ApiError ? error.message : "系統發生錯誤，請稍後再試。";
}

function fundName(id: string): string {
  return funds.value.find((fund) => fund.id === id)?.name ?? "（已刪除的基金）";
}

function accountName(id: string): string {
  return accounts.value.find((account) => account.id === id)?.name ?? "（已刪除的帳戶）";
}

// Next time the daily cron will post this schedule; days past the month's end run on its last day.
function nextRunDate(cycleDay: number, now = new Date()): Date {
  const runAt = (year: number, month: number): Date => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(cycleDay, lastDay), RUN_HOUR_UTC, RUN_MINUTE_UTC));
  };
  const thisMonth = runAt(now.getUTCFullYear(), now.getUTCMonth());
  return thisMonth > now ? thisMonth : runAt(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [scheduleData, fundData, accountData] = await Promise.all([
      pocketfundApi.listSchedules(),
      pocketfundApi.listFunds(),
      pocketfundApi.listAccounts()
    ]);
    schedules.value = scheduleData;
    funds.value = fundData;
    accounts.value = accountData;
  } catch (error) {
    onError(error);
  } finally {
    loading.value = false;
  }
}

function onFundChange(): void {
  const fund = funds.value.find((item) => item.id === form.fundId);
  if (fund) form.cycleDay = fund.cycle_day;
}

function openCreateDialog(): void {
  const fund = funds.value[0];
  form.id = "";
  form.fundId = fund?.id ?? "";
  form.accountId = accounts.value[0]?.id ?? "";
  form.amount = null;
  form.cycleDay = fund?.cycle_day ?? 1;
  form.description = "";
  errorMessage.value = "";
  showDialog.value = true;
}

function openEditDialog(schedule: ScheduledTopUp): void {
  form.id = schedule.id;
  form.fundId = schedule.fund_id;
  form.accountId = schedule.account_id;
  form.amount = Number(schedule.amount);
  form.cycleDay = schedule.cycle_day;
  form.description = schedule.description ?? "";
  errorMessage.value = "";
  showDialog.value = true;
}

async function save(): Promise<void> {
  if (submitting.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    const payload = {
      accountId: form.accountId,
      amount: Number(form.amount),
      cycleDay: form.cycleDay,
      description: form.description
    };
    if (form.id) {
      await pocketfundApi.updateSchedule(form.id, payload);
    } else {
      await pocketfundApi.createSchedule({ ...payload, fundId: form.fundId, description: form.description || undefined });
    }
    showDialog.value = false;
    schedules.value = await pocketfundApi.listSchedules();
    showSuccess(form.id ? "自動儲值已更新" : "自動儲值已建立");
  } catch (error) {
    onError(error);
  } finally {
    submitting.value = false;
  }
}

async function toggleActive(schedule: ScheduledTopUp): Promise<void> {
  busyId.value = schedule.id;
  errorMessage.value = "";
  try {
    const updated = await pocketfundApi.updateSchedule(schedule.id, { isActive: !schedule.is_active });
    schedules.value = schedules.value.map((item) => (item.id === updated.id ? updated : item));
    showSuccess(updated.is_active ? "已恢復自動儲值" : "已暫停自動儲值");
  } catch (error) {
    onError(error);
  } finally {
    busyId.value = "";
  }
}

async function confirmDelete(): Promise<void> {
  if (!deleting.value || submitting.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    await pocketfundApi.deleteSchedule(deleting.value.id);
    schedules.value = schedules.value.filter((item) => item.id !== deleting.value?.id);
    deleting.value = null;
    showSuccess("自動儲值已刪除");
  } catch (error) {
    onError(error);
    deleting.value = null;
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
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

.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--primary-soft-color);
  font-weight: 600;
}

.summary strong {
  font-size: 22px;
}

.summary-sub {
  margin-left: auto;
  color: var(--text-muted-color);
  font-size: 13px;
  font-weight: 400;
}

.loading {
  padding: 48px 0;
  text-align: center;
  color: var(--text-muted-color);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.schedule {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px 16px 20px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: inset 4px 0 0 var(--primary-color), var(--shadow-sm);
}

.schedule.paused {
  box-shadow: inset 4px 0 0 var(--border-strong-color), var(--shadow-sm);
}

.schedule.paused .schedule-main,
.schedule.paused .amount {
  opacity: 0.55;
}

.schedule-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.schedule-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fund-name {
  font-size: 16px;
  font-weight: 700;
}

.badge {
  padding: 1px 8px;
  border-radius: 99px;
  background: var(--surface-muted-color);
  color: var(--text-muted-color);
  font-size: 12px;
}

.schedule-meta {
  color: var(--text-muted-color);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.schedule-next {
  margin-top: 4px;
  color: var(--accent-text-color);
  font-size: 13px;
  font-weight: 600;
}

.schedule-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.amount {
  font-size: 18px;
  font-weight: 700;
}

.schedule-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Toggle switch */
.switch {
  position: relative;
  width: 44px;
  height: 26px;
  margin-right: 4px;
  padding: 0;
  border: none;
  border-radius: 99px;
  background: var(--border-strong-color);
  cursor: pointer;
  transition: var(--transition-fast);
}

.switch[aria-checked="true"] {
  background: var(--primary-color);
}

.switch:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring-color);
}

.switch:disabled {
  opacity: 0.6;
  cursor: wait;
}

.switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
  transition: transform 0.2s ease;
}

.switch[aria-checked="true"] .switch-thumb {
  transform: translateX(18px);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 8px;
  text-align: center;
  color: var(--text-muted-color);
}

.empty p {
  margin: 0;
  line-height: 1.7;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-hint {
  color: var(--text-muted-color);
  font-size: 12px;
}

.dialog-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-muted-color);
  color: var(--text-muted-color);
  font-size: 13px;
  line-height: 1.6;
}

.confirm-text {
  margin: 0;
  line-height: 1.6;
}

.confirm-desc {
  color: var(--text-muted-color);
  font-size: 13px;
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }

  .page-head h1 {
    font-size: 22px;
  }

  .schedule {
    flex-direction: column;
    gap: 8px;
  }

  .schedule-side {
    flex-direction: row;
    align-items: center;
  }
}
</style>
