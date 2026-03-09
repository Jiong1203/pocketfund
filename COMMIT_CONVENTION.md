# Git Commit Message 規範

本專案遵循 AngularJS Git Commit Message Conventions，並加入中文化調整。

## 規範目的

- 寫下「為什麼」你要作這樣的異動，而不只是「什麼」異動
- Commit 記錄訊息最好兼具 Why 及 What，讓日後維護人員更快進入狀況
- 每次 commit 針對異動的檔案做說明：原因 & 調整項目
- 保持程式碼整潔，將註解記錄在 commit 裡面

## Commit Message 格式

```
<type>: <subject>

<原因>
<說明為什麼需要這次異動>

<調整項目>
<列出具體變更的項目>

issue #<issue編號>（如果有的話）
```

### 必要欄位

1. **type**: commit 的類別（必要）
2. **subject**: 簡短描述，不超過 50 個字元，結尾不加句號（必要）
3. **原因**: 說明為什麼需要這次變更（必要）
4. **調整項目**: 列出具體變更的檔案或功能（必要）

### Type 類別

只允許使用以下類別：

- **feat**: 新增/修改功能
- **fix**: 修補 bug
- **docs**: 文件變更
- **style**: 格式調整（不影響程式碼運行，如空格、格式化、缺少分號等）
- **refactor**: 重構（既不是新增功能，也不是修補 bug 的程式碼變動）
- **perf**: 改善效能
- **test**: 增加測試
- **chore**: 建構程序或輔助工具的變動（如更新套件、調整設定檔）
- **revert**: 撤銷先前的 commit

## 範例

### 範例 1: fix

```
fix: 表單驗證邏輯錯誤導致空值可送出

原因：
1. 原程式碼在檢查必填欄位時，只判斷欄位是否存在，未檢查是否為空字串
2. 造成使用者可以送出空白表單，導致後端資料不完整

調整項目：
1. src/validators/form.validator.ts - 新增空字串檢查邏輯
2. test/unit/validators/form.validator.spec.ts - 新增空值測試案例
3. src/dto/create-fund.dto.ts - 加強欄位驗證規則

issue #123
```

### 範例 2: feat

```
feat: 新增定期儲值排程功能

原因：
1. 使用者希望能設定每月自動儲值，避免忘記手動操作
2. 需要支援不同週期（每日/每週/每月）的自動儲值

調整項目：
1. src/modules/schedules/schedules.module.ts - 新增排程模組
2. src/modules/schedules/schedules.service.ts - 實作排程邏輯
3. src/modules/schedules/schedules.controller.ts - 新增 CRUD API
4. migrations/003_add_schedules.sql - 新增 schedules 資料表
5. test/e2e/schedules.e2e-spec.ts - 新增 E2E 測試

issue #456
```

### 範例 3: refactor

```
refactor: 重構交易查詢邏輯，統一使用 QueryBuilder

原因：
1. 原程式碼交易查詢邏輯散落在多個服務中，維護困難
2. SQL 拼接方式不一致，容易產生 SQL injection 風險
3. 為了未來擴充查詢條件時更容易維護

調整項目：
1. src/modules/transactions/transaction.query-builder.ts - 新增查詢建構器
2. src/modules/funds/funds.service.ts - 改用 QueryBuilder 查詢交易
3. src/modules/accounts/accounts.service.ts - 改用 QueryBuilder 查詢交易
4. test/unit/transactions/transaction.query-builder.spec.ts - 新增單元測試

issue #789
```

### 範例 4: perf

```
perf: 優化基金餘額查詢效能

原因：
1. 原本每次查詢餘額都會掃描全部交易記錄，造成查詢緩慢
2. 測試環境單一基金查詢時間約 3 秒，影響使用者體驗

調整項目：
1. migrations/004_add_balance_index.sql - 新增 fund_id 和 created_at 的複合索引
2. src/modules/funds/funds.service.ts - 調整查詢邏輯，使用索引優化

結果：
查詢時間從 3 秒降至 0.2 秒

issue #234
```

### 範例 5: chore

```
chore: 更新 NestJS 至 v10.4.15

原因：
1. 修復已知的安全性漏洞
2. 支援更好的 TypeScript 類型推斷

調整項目：
1. package.json - 更新 @nestjs/* 相關套件版本
2. package-lock.json - 更新依賴鎖定檔

issue #567
```

### 範例 6: docs

```
docs: 新增 API 文件與部署說明

原因：
1. 新成員加入專案時，缺少完整的 API 使用說明
2. 需要統一部署流程文件，避免環境設定錯誤

調整項目：
1. docs/API.md - 新增所有 API endpoint 說明與範例
2. docs/DEPLOYMENT.md - 新增部署步驟與環境變數說明
3. README.md - 更新快速開始指南，新增文件連結

issue #890
```

## 注意事項

1. **獨立 commit**: 每個不同意義的異動應該獨立 commit，不要一次 commit 所有變更
2. **詳細說明**: Body 部份詳細描述變動的原因、項目，以及與先前行為的對比
3. **Issue 追蹤**: 如果有 issue 編號，請在 Footer 加上 issue 編號
4. **行數限制**:
   - Subject 不超過 50 個字元
   - Body 每行不超過 72 個字元
5. **語意化**: 使用清晰、具體的描述，避免模糊的詞彙如「修改」、「調整」等

## 不良範例

❌ **不好的 commit message:**

```
fix: 修改程式碼
```

```
feat: update
```

```
refactor: 重構
```

✅ **好的 commit message:**

```
fix: 修正登入失敗後 token 未清除問題

原因：
使用者登入失敗後，舊的 token 仍存在 localStorage，
導致下次登入時使用到過期 token，造成授權錯誤。

調整項目：
1. src/auth/auth.service.ts - 登入失敗時清除舊 token
2. test/e2e/auth.e2e-spec.ts - 新增登入失敗情境測試
```

## 參考資料

- [AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit)
- [Git Commit Message 這樣寫會更好](https://ithelp.ithome.com.tw/articles/10228738)
