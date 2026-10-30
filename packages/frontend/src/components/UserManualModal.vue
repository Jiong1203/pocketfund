<template>
  <Teleport to="body">
    <div v-if="modelValue" class="manual-backdrop" @click.self="$emit('update:modelValue', false)">
      <div class="manual-panel">
        <div class="manual-header">
          <h2>使用手冊</h2>
          <button type="button" class="btn btn-icon" aria-label="關閉使用手冊" @click="$emit('update:modelValue', false)"><AppIcon name="close" /></button>
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
                <tr><td>基金</td><td>新增資金用途分類（例如：旅遊基金、緊急備用金），並顯示每個基金的即時餘額與總餘額</td></tr>
                <tr><td>交易紀錄</td><td>查看、篩選、編輯、刪除所選基金的交易紀錄</td></tr>
              </tbody>
            </table>
            <p>頁面最上方的導覽列：</p>
            <ul>
              <li><strong>「儀表板」/「自動儲值」/「圖表」</strong> — 切換主要頁面（手機版位於畫面底部）</li>
              <li><strong>書本圖示</strong> — 開啟本使用手冊</li>
              <li><strong>月亮 / 太陽圖示</strong> — 切換深色 / 淺色主題</li>
              <li><strong>登出圖示</strong> — 結束工作階段</li>
            </ul>
          </section>

          <section id="account">
            <h3>4. 建立與管理帳戶</h3>
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
            <h4>修改或刪除帳戶</h4>
            <ol>
              <li>點擊帳戶右側的 <strong>鉛筆圖示</strong>，可修改帳戶名稱與類型。</li>
              <li>在編輯視窗左下角點擊 <strong>「刪除帳戶」</strong>，確認後即可刪除。</li>
            </ol>
            <p class="note">已有交易或自動儲值的帳戶無法刪除，以免帳目對不起來。</p>
          </section>

          <section id="fund">
            <h3>5. 建立與管理基金</h3>
            <p>「基金」代表資金的使用用途（例如：旅遊、日常開銷）。</p>
            <ol>
              <li>在基金卡片中，點擊 <strong>「＋ 新增基金」</strong>。</li>
              <li>輸入 <strong>基金名稱</strong>（例如：旅遊基金）。</li>
              <li>選擇 <strong>每月補充日</strong>（1–31 日），新增自動儲值時會預設使用這一天。</li>
              <li>點擊 <strong>「建立基金」</strong>。</li>
              <li>成功後，基金與目前餘額出現在卡片列表中。</li>
            </ol>
            <h4>修改或刪除基金</h4>
            <ol>
              <li>點擊基金右側的 <strong>鉛筆圖示</strong>，可修改基金名稱與每月補充日。</li>
              <li>在編輯視窗左下角點擊 <strong>「刪除基金」</strong>，確認後即可刪除。</li>
            </ol>
            <p class="note">只有沒有任何交易和自動儲值的基金可以刪除。</p>
          </section>

          <section id="auto-topup">
            <h3>6. 自動儲值</h3>
            <p>每月固定日期，自動把錢從帳戶存進基金，例如每月 5 日發薪後存 15,000 到「生活費」。</p>
            <ol>
              <li>點擊導覽列的 <strong>「自動儲值」</strong>，再點擊 <strong>「＋ 新增自動儲值」</strong>。</li>
              <li>選擇 <strong>存入基金</strong> 與 <strong>從哪個帳戶</strong>。</li>
              <li>輸入 <strong>每月金額</strong>，選擇 <strong>每月幾號</strong>，可加上說明。</li>
              <li>點擊 <strong>「建立」</strong>，列表會顯示下次執行日期。</li>
            </ol>
            <ul>
              <li><strong>開關</strong>：暫時不需要時可以關閉，之後再打開即可恢復。</li>
              <li><strong>鉛筆圖示</strong>：修改帳戶、金額、日期或說明（基金建立後無法更換）。</li>
              <li><strong>垃圾桶圖示</strong>：刪除自動儲值，之前已自動存入的交易會保留。</li>
            </ul>
            <div class="tip-box">
              <strong>執行時間：</strong> 每天台灣時間早上 8 點左右執行。若當月沒有設定的日期（例如 31 日遇到 30 天的月份），會在當月最後一天存入。
            </div>
          </section>

          <section id="transaction">
            <h3>7. 新增交易</h3>
            <p>記錄資金的儲值或支出。</p>
            <ol>
              <li>點擊交易紀錄卡片右上角 <strong>「＋ 新增交易」</strong>。</li>
              <li>在最上方切換 <strong>交易類型</strong>（預設為支出）：
                <ul>
                  <li><strong>儲值 (TOP_UP)</strong> — 將資金加入基金</li>
                  <li><strong>支出 (EXPENSE)</strong> — 從基金扣除資金</li>
                </ul>
              </li>
              <li>輸入 <strong>金額</strong>（正整數）。</li>
              <li>確認 <strong>基金</strong> 與 <strong>帳戶</strong>（基金預設為目前選取的基金）。</li>
              <li>確認 <strong>交易日期</strong>（預設為今天）。</li>
              <li>輸入 <strong>備註</strong>（選填，例如：早餐、7-11）。</li>
              <li>點擊 <strong>「送出交易」</strong>。</li>
            </ol>
            <p class="note">基金餘額 = 所有 TOP_UP 總和 − 所有 EXPENSE 總和，系統即時計算，不另行儲存。</p>
          </section>

          <section id="edit-delete">
            <h3>8. 編輯與刪除交易</h3>
            <p>若交易記錄有誤，可直接編輯或刪除。</p>
            <h4>編輯交易</h4>
            <ol>
              <li>在交易列表中，點擊該筆交易右側的 <strong>鉛筆圖示</strong>。</li>
              <li>修改 <strong>交易日期、類型、金額</strong> 或 <strong>說明</strong>。</li>
              <li>點擊 <strong>「儲存變更」</strong>。</li>
            </ol>
            <h4>刪除交易</h4>
            <ol>
              <li>點擊該筆交易右側的 <strong>垃圾桶圖示</strong>。</li>
              <li>確認刪除對話框出現後，點擊 <strong>「確認刪除」</strong>。</li>
            </ol>
            <p class="note warning">刪除為永久操作，無法還原，請謹慎確認。</p>
          </section>

          <section id="query">
            <h3>9. 查詢交易紀錄</h3>
            <p>篩選並瀏覽指定基金的歷史交易。</p>
            <ol>
              <li>點擊基金卡片中的基金，或從篩選列的下拉選單選擇 <strong>基金</strong>。</li>
              <li>選擇 <strong>類型</strong>（選填）：全部 / 儲值 / 支出 / 轉帳。</li>
              <li>選擇 <strong>每頁筆數</strong>（10 / 20 / 50 筆）。</li>
            </ol>
            <p>變更篩選條件後列表會自動更新。紀錄超過一頁時，可點擊 <strong>「下一頁」</strong> 或 <strong>「上一頁」</strong> 瀏覽。</p>
          </section>

          <section id="charts">
            <h3>10. 基金圖表</h3>
            <p>以月份為單位，視覺化呈現基金的收支走勢。</p>
            <p>點擊導覽列的 <strong>「圖表」</strong> 進入圖表頁：</p>
            <ol>
              <li>從右上方的下拉選單選擇要查看的 <strong>基金</strong>，圖表會自動更新。</li>
              <li>上方卡片顯示該基金的 <strong>目前餘額、累計儲值與累計支出</strong>。</li>
              <li>長條圖以綠色呈現每月儲值、紅色呈現每月支出；將滑鼠移到（或點一下）月份，可在下方看到該月明細與淨額。</li>
            </ol>
            <p>點擊導覽列的 <strong>「儀表板」</strong> 回到主頁面。</p>
          </section>

          <section id="theme">
            <h3>11. 主題切換</h3>
            <p>應用程式支援 <strong>淺色</strong> 與 <strong>深色</strong> 兩種主題。</p>
            <ul>
              <li>點擊導覽列的月亮圖示切換為深色主題，太陽圖示切換回淺色主題。</li>
              <li>淺色主題以 SHINee 的珍珠薄荷綠為主色，深色主題以 BABYMONSTER 的紅色為主色。</li>
              <li>主題偏好儲存於瀏覽器，下次開啟時自動套用。</li>
            </ul>
          </section>

          <section id="logout">
            <h3>12. 登出</h3>
            <ul>
              <li>點擊導覽列最右側的 <strong>登出圖示</strong>。</li>
              <li>系統清除登入狀態並跳轉至登入頁面。</li>
            </ul>
          </section>

          <section id="faq">
            <h3>13. 常見問答</h3>
            <div class="faq-item">
              <p class="faq-q">Q: 基金餘額在哪裡查看？</p>
              <p>A: 儀表板的基金卡片會顯示每個基金的餘額與所有基金的總餘額，由交易紀錄即時加總計算。</p>
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
import AppIcon from "./AppIcon.vue";

defineProps<{ modelValue: boolean }>();
defineEmits<{ "update:modelValue": [value: boolean] }>();

const bodyRef = ref<HTMLElement | null>(null);

const toc = [
  { id: "getting-started", label: "1. 開始使用" },
  { id: "login", label: "2. 登入與註冊" },
  { id: "dashboard", label: "3. 儀表板總覽" },
  { id: "account", label: "4. 建立與管理帳戶" },
  { id: "fund", label: "5. 建立與管理基金" },
  { id: "auto-topup", label: "6. 自動儲值" },
  { id: "transaction", label: "7. 新增交易" },
  { id: "edit-delete", label: "8. 編輯與刪除交易" },
  { id: "query", label: "9. 查詢交易紀錄" },
  { id: "charts", label: "10. 基金圖表" },
  { id: "theme", label: "11. 主題切換" },
  { id: "logout", label: "12. 登出" },
  { id: "faq", label: "13. 常見問答" },
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
  max-height: 88dvh;
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
  color: var(--accent-text-color);
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
  color: var(--accent-text-color);
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
  color: var(--accent-text-color);
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
  color: var(--accent-text-color) !important;
}

/* Phones: the manual takes the whole screen. */
@media (max-width: 640px) {
  .manual-backdrop {
    padding: 0;
  }

  .manual-panel {
    max-height: none;
    height: 100dvh;
    border-radius: 0;
    border: none;
  }

  .manual-header,
  .manual-toc,
  .manual-body {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
