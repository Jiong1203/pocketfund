<template>
  <Teleport to="body">
    <div v-if="modelValue" class="manual-backdrop" @click.self="$emit('update:modelValue', false)">
      <div class="manual-panel">
        <div class="manual-header">
          <h2>使用手冊</h2>
          <button type="button" class="btn-close" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <nav class="manual-toc">
          <a v-for="item in toc" :key="item.id" :href="`#${item.id}`" @click.prevent="scrollTo(item.id)">
            {{ item.label }}
          </a>
        </nav>

        <div class="manual-body" ref="bodyRef">
          <section id="getting-started">
            <h3>1. 開始使用</h3>
            <p>開啟瀏覽器，前往應用程式網址。若尚未登入，系統會自動導向登入頁面。</p>
            <div class="tip-box">
              <strong>建議首次使用流程：</strong>
              <p>註冊帳號 → 建立帳戶 → 建立基金 → 開始記帳</p>
            </div>
          </section>

          <section id="login">
            <h3>2. 登入與註冊</h3>
            <h4>註冊新帳號</h4>
            <ol>
              <li>進入登入頁面，點擊上方 <strong>「註冊」</strong> 分頁。</li>
              <li>輸入你的 <strong>電子郵件</strong> 與 <strong>密碼</strong>（至少 6 個字元）。</li>
              <li>點擊 <strong>「建立帳號」</strong>。</li>
              <li>成功後自動登入並跳轉至儀表板。</li>
            </ol>
            <h4>登入現有帳號</h4>
            <ol>
              <li>確認分頁切換至 <strong>「登入」</strong>。</li>
              <li>輸入電子郵件與密碼。</li>
              <li>點擊 <strong>「登入」</strong>。</li>
              <li>成功後跳轉至儀表板。</li>
            </ol>
            <p class="note">若輸入有誤，頁面下方會以紅色顯示錯誤訊息。</p>
          </section>

          <section id="dashboard">
            <h3>3. 儀表板總覽</h3>
            <p>登入後進入主頁面，畫面分為主要功能區塊：</p>
            <table>
              <thead>
                <tr><th>卡片區塊</th><th>功能說明</th></tr>
              </thead>
              <tbody>
                <tr><td>帳戶</td><td>新增與管理存放資金的帳戶（例如：薪轉戶、儲蓄戶）</td></tr>
                <tr><td>基金</td><td>新增與管理資金用途分類（例如：旅遊基金、緊急備用金）</td></tr>
                <tr><td>交易查詢</td><td>查詢、篩選、編輯、刪除交易紀錄</td></tr>
              </tbody>
            </table>
            <p>右上角按鈕：</p>
            <ul>
              <li><strong>「查看基金圖表」</strong> — 跳轉至圖表頁</li>
              <li><strong>「使用手冊」</strong> — 開啟本手冊</li>
              <li><strong>「登出」</strong> — 結束工作階段</li>
            </ul>
          </section>

          <section id="account">
            <h3>4. 建立帳戶</h3>
            <p>「帳戶」代表資金實際存放的地方（例如銀行帳戶）。</p>
            <ol>
              <li>在帳戶卡片中，點擊 <strong>「＋ 新增帳戶」</strong>。</li>
              <li>輸入 <strong>帳戶名稱</strong>（例如：玉山薪轉）。</li>
              <li>從下拉選單選擇 <strong>帳戶類型</strong>：
                <ul>
                  <li><strong>薪轉戶</strong> — 日常收入來源帳戶</li>
                  <li><strong>儲蓄戶</strong> — 長期存放帳戶</li>
                </ul>
              </li>
              <li>點擊 <strong>「建立帳戶」</strong>。</li>
              <li>成功後，帳戶名稱出現在卡片列表中。</li>
            </ol>
          </section>

          <section id="fund">
            <h3>5. 建立基金</h3>
            <p>「基金」代表資金的使用用途（例如：旅遊、日常開銷）。</p>
            <ol>
              <li>在基金卡片中，點擊 <strong>「＋ 新增基金」</strong>。</li>
              <li>輸入 <strong>基金名稱</strong>（例如：旅遊基金）。</li>
              <li>輸入 <strong>循環日</strong>（數字 1–31），代表每月補充資金的起始日期。</li>
              <li>點擊 <strong>「建立基金」</strong>。</li>
              <li>成功後，基金名稱與循環日出現在卡片列表中。</li>
            </ol>
            <div class="tip-box">
              <strong>範例：</strong> 循環日設為 <code>5</code>，表示每月 5 日為該基金的月結算起點。
            </div>
          </section>

          <section id="transaction">
            <h3>6. 新增交易</h3>
            <p>記錄資金的儲值或支出。</p>
            <ol>
              <li>點擊交易查詢卡片右上角 <strong>「＋ 新增交易」</strong>。</li>
              <li>從下拉選單選擇 <strong>基金</strong> 與 <strong>帳戶</strong>。</li>
              <li>選擇 <strong>交易類型</strong>：
                <ul>
                  <li><strong>儲值 (TOP_UP)</strong> — 將資金加入基金</li>
                  <li><strong>支出 (EXPENSE)</strong> — 從基金扣除資金</li>
                </ul>
              </li>
              <li>輸入 <strong>金額</strong>（正整數）。</li>
              <li>輸入 <strong>備註</strong>（選填，例如：早餐、7-11）。</li>
              <li>點擊 <strong>「送出交易」</strong>。</li>
            </ol>
            <p class="note">基金餘額 = 所有 TOP_UP 總和 − 所有 EXPENSE 總和，系統即時計算，不另行儲存。</p>
          </section>

          <section id="edit-delete">
            <h3>7. 編輯與刪除交易</h3>
            <p>若交易記錄有誤，可直接編輯或刪除。</p>
            <h4>編輯交易</h4>
            <ol>
              <li>在交易列表中，點擊該筆交易右側的 <strong>「編輯」</strong> 按鈕。</li>
              <li>修改 <strong>交易類型、金額、說明</strong> 或 <strong>交易時間</strong>。</li>
              <li>點擊 <strong>「儲存變更」</strong>。</li>
            </ol>
            <h4>刪除交易</h4>
            <ol>
              <li>點擊該筆交易右側的 <strong>「刪除」</strong> 按鈕。</li>
              <li>確認刪除對話框出現後，點擊 <strong>「確認刪除」</strong>。</li>
            </ol>
            <p class="note warning">刪除為永久操作，無法還原，請謹慎確認。</p>
          </section>

          <section id="query">
            <h3>8. 查詢交易紀錄</h3>
            <p>篩選並瀏覽指定基金的歷史交易。</p>
            <ol>
              <li>從下拉選單選擇 <strong>基金</strong>。</li>
              <li>選擇 <strong>交易類型篩選</strong>（選填）：全部 / TOP_UP / EXPENSE / TRANSFER。</li>
              <li>設定 <strong>每頁筆數</strong>（預設 20，最多 100）。</li>
              <li>點擊 <strong>「查詢」</strong>。</li>
            </ol>
            <p>點擊 <strong>「下一頁」</strong> 或 <strong>「上一頁」</strong> 瀏覽更多紀錄。頁碼格式：<code>第 X 頁 / 共 Y 筆</code>。</p>
          </section>

          <section id="charts">
            <h3>9. 基金圖表</h3>
            <p>以月份為單位，視覺化呈現基金的收支走勢。</p>
            <p>點擊右上角 <strong>「查看基金圖表」</strong> 進入圖表頁：</p>
            <ol>
              <li>從下拉選單選擇要查看的 <strong>基金</strong>。</li>
              <li>點擊 <strong>「更新圖表」</strong>。</li>
              <li>圖表呈現每月儲值（藍色長條）與支出（紅色折線）趨勢。</li>
            </ol>
            <p>點擊左上角 <strong>「返回儀表板」</strong> 回到主頁面。</p>
          </section>

          <section id="theme">
            <h3>10. 主題切換</h3>
            <p>應用程式支援 <strong>淺色</strong> 與 <strong>深色</strong> 兩種主題。</p>
            <ul>
              <li>點擊頁面右上角圓形按鈕切換主題（☀️ 淺色 / 🌙 深色）。</li>
              <li>主題偏好儲存於瀏覽器，下次開啟時自動套用。</li>
            </ul>
          </section>

          <section id="logout">
            <h3>11. 登出</h3>
            <ul>
              <li>點擊任意頁面右上角 <strong>「登出」</strong> 按鈕。</li>
              <li>系統清除登入狀態並跳轉至登入頁面。</li>
            </ul>
          </section>

          <section id="faq">
            <h3>12. 常見問答</h3>
            <div class="faq-item">
              <p class="faq-q">Q: 基金餘額在哪裡查看？</p>
              <p>A: 目前餘額由交易紀錄加總計算。可在交易查詢中查看所有 TOP_UP 與 EXPENSE，或前往圖表頁面觀察累積趨勢。</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">Q: 帳戶和基金有什麼差別？</p>
              <p>A: <strong>帳戶</strong> 是資金存放的地方（實體銀行帳戶），<strong>基金</strong> 是資金的用途分類。每筆交易都需同時指定帳戶與基金。</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">Q: 記錯金額怎麼辦？</p>
              <p>A: 直接在交易列表中點擊「編輯」修改，或點擊「刪除」移除錯誤記錄後重新新增。</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">Q: 忘記密碼怎麼辦？</p>
              <p>A: 目前版本尚未提供密碼重設功能，請聯繫系統管理員。</p>
            </div>
            <div class="faq-item">
              <p class="faq-q">Q: 支援哪些瀏覽器？</p>
              <p>A: 建議使用最新版 Chrome、Firefox、Edge 或 Safari。</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{ modelValue: boolean }>();
defineEmits<{ "update:modelValue": [value: boolean] }>();

const bodyRef = ref<HTMLElement | null>(null);

const toc = [
  { id: "getting-started", label: "1. 開始使用" },
  { id: "login", label: "2. 登入與註冊" },
  { id: "dashboard", label: "3. 儀表板總覽" },
  { id: "account", label: "4. 建立帳戶" },
  { id: "fund", label: "5. 建立基金" },
  { id: "transaction", label: "6. 新增交易" },
  { id: "edit-delete", label: "7. 編輯與刪除交易" },
  { id: "query", label: "8. 查詢交易紀錄" },
  { id: "charts", label: "9. 基金圖表" },
  { id: "theme", label: "10. 主題切換" },
  { id: "logout", label: "11. 登出" },
  { id: "faq", label: "12. 常見問答" },
];

function scrollTo(id: string): void {
  const el = bodyRef.value?.querySelector(`#${id}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<style scoped>
.manual-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(2px);
  padding: 20px;
}

.manual-panel {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 16px);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 860px;
  max-height: 88vh;
  display: grid;
  grid-template-rows: auto auto 1fr;
  overflow: hidden;
}

/* Header */
.manual-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px 16px;
  border-bottom: 1px solid var(--border-color);
}

.manual-header h2 {
  margin: 0;
  font-size: 20px;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted-color);
  font-size: 16px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: var(--radius-md, 8px);
  transition: var(--transition-fast);
}

.btn-close:hover {
  background: var(--surface-color);
  color: var(--text-color);
}

/* TOC */
.manual-toc {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 12px 28px;
  border-bottom: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--primary-color) 4%, transparent);
}

.manual-toc a {
  font-size: 12px;
  color: var(--primary-color);
  text-decoration: none;
  white-space: nowrap;
}

.manual-toc a:hover {
  text-decoration: underline;
}

/* Body */
.manual-body {
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

section h3 {
  margin: 0;
  font-size: 16px;
  color: var(--primary-color);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

section h4 {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--text-color);
}

section p,
section li {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-color);
}

section ol,
section ul {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  text-align: left;
}

th {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  color: var(--text-color);
  font-weight: 600;
}

/* Note & tip */
.note {
  font-size: 13px !important;
  color: var(--text-muted-color) !important;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--primary-color) 6%, transparent);
  border-left: 3px solid var(--primary-color);
  border-radius: 0 6px 6px 0;
}

.note.warning {
  color: #b45309 !important;
  background: color-mix(in srgb, #f59e0b 10%, transparent);
  border-left-color: #f59e0b;
}

.tip-box {
  background: color-mix(in srgb, var(--primary-color) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
}

.tip-box strong {
  display: block;
  margin-bottom: 4px;
}

.tip-box p {
  margin: 0;
  color: var(--text-muted-color);
}

code {
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--primary-color);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}

/* FAQ */
.faq-item {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.faq-q {
  font-weight: 600;
  color: var(--primary-color) !important;
}
</style>
