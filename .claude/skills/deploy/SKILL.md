---
name: deploy
description: 部署 PocketFund 到 Cloudflare。先以 `npm run migrate:status` 比對資料庫的 schema_migrations，自動判斷是否需要 `npm run migrate`，需要才執行，接著執行 `npm run deploy`。當使用者說部署、上線、deploy、發佈到正式環境時使用。
---

# deploy — 自動判斷 migration 後部署

PocketFund 的前端（Vue SPA）與後端（Hono API）是**同一個 Cloudflare Worker**，`npm run deploy` 一次部署兩者。
資料庫 migration 則是另外以 Node 腳本直接連 `DATABASE_URL` 執行，**不會**隨 deploy 自動跑，所以部署前要先判斷。

所有指令都在**專案根目錄**執行。

## 步驟

### 1. 部署前檢查

```bash
git status --short
git branch --show-current
git fetch origin && git status -sb
```

- 工作區有未提交的變更 → **停下來詢問使用者**：部署會把本機檔案（含未提交的改動）打包上去，正式環境會跑到不在版控裡的程式碼。
- 不在 `main`，或與 `origin/main` 不同步 → 告知使用者並確認是否仍要部署。
- 確認 `packages/backend/.env` 存在（內含 `DATABASE_URL`）；不存在就停止，請使用者補上，**不要**自行猜測連線字串。

### 2. 判斷是否需要 migration

```bash
npm run migrate:status
```

依輸出判斷：

| 輸出 | 意義 | 動作 |
|---|---|---|
| `No pending migrations.` | 資料庫已是最新 | 跳過 migration，直接到步驟 4 |
| `[pending] 00X_xxx.sql` + `Pending migrations: N` | 有尚未套用的 migration | 進入步驟 3 |
| `Migration failed: ...` / 連線錯誤 | 無法判斷 | **停止**，回報錯誤，不要部署 |

### 3. 執行 migration（僅在有 pending 時）

1. 先把每個 pending 檔案的內容讀出來（`packages/backend/migrations/<檔名>`），向使用者簡述會做什麼（新增欄位、改 constraint、刪資料等）。
2. 若 migration 含**破壞性操作**（`drop column`、`drop table`、刪除或大量改寫資料、收緊 `not null` / check constraint），先取得使用者確認再執行。
3. 執行：

   ```bash
   npm run migrate
   ```

4. 確認輸出每個 pending 檔都有 `[done]`，最後是 `Migrations complete.`。
5. 任何一個失敗（`Migration failed:`）→ **停止，不要 deploy**。每個檔案各自在 transaction 內，失敗的那個會 rollback，但前面已 `[done]` 的會保留；把狀態完整回報給使用者。

> 順序是**先 migrate 再 deploy**：依 `CLAUDE.md` §11，schema 必須先以向下相容的方式上線，新程式碼部署後才會用到新結構。若某個 migration 會讓**舊版程式碼**壞掉（例如刪掉舊程式還在讀的欄位），應該拆成兩階段，提醒使用者而不是硬跑。

### 4. 部署

```bash
npm run deploy
```

這會依序執行 `vue-tsc -b`（型別檢查）→ `cf build` → `cf deploy --prebuilt`。

- 型別檢查或 build 失敗 → 回報錯誤，不要重試同一指令，也不要為了通過而修改程式碼（除非使用者要求）。
- 若在步驟 3 已執行 migration 但 deploy 失敗，**明確告知**：資料庫已是新結構，但線上仍是舊程式碼，需要儘快修好後重新部署。

### 5. 回報

- migration：跳過，或列出已套用的檔案。
- deploy：成功或失敗，附上輸出中的部署網址／版本資訊。
- 提醒使用者在正式環境實際操作一次本次改動的功能（這個 skill 只確認部署成功，不代表功能已驗證）。

## 注意事項

- `npm run migrate:status` 只讀取 `schema_migrations`，不會修改資料庫，可以放心先跑。
- 不要用 `--force` 類參數跳過任何錯誤，也不要手動改正式資料庫（`CLAUDE.md` §11）。
- 在 PowerShell 下 npm／git 的 stderr 可能讓 exit code 看起來失敗；判斷成敗以實際輸出內容為準。
