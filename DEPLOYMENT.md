# Fly.io 部署指南

本文件說明如何將 pocketfund 部署到 Fly.io（0 成本方案）。

---

## 前置準備

### 1. 註冊 Fly.io 帳號

1. 前往 [fly.io](https://fly.io/app/sign-up)
2. 註冊帳號（需要信用卡驗證，但不會扣款）
3. 免費額度：
   - 3 個共享 CPU VM (256MB RAM)
   - 3GB 持久化儲存
   - 160GB 出站流量/月

### 2. 安裝 Fly CLI

**Windows (PowerShell)**:
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux**:
```bash
curl -L https://fly.io/install.sh | sh
```

### 3. 登入 Fly.io

```bash
fly auth login
```

---

## 部署步驟

### Step 1: 部署 Backend

#### 1.1 在專案根目錄執行

```bash
# 初始化 Fly 應用（首次部署）
fly launch --no-deploy

# 系統會問你：
# - App name: pocketfund-backend (或自訂名稱)
# - Region: sin (Singapore) 或 nrt (Tokyo)
# - Would you like to set up a PostgreSQL database? → No (我們用 Supabase)
# - Would you like to set up an Upstash Redis database? → No
```

#### 1.2 設定環境變數

```bash
# 設定資料庫連線
fly secrets set DATABASE_URL="postgresql://postgres:cpgc95AnzI47hXPh@db.rzfwryuvxfuczhagmrde.supabase.co:5432/postgres"

# 設定 JWT 密鑰（請改成你的）
fly secrets set JWT_SECRET="your-strong-secret-key-here"
```

#### 1.3 部署

```bash
fly deploy
```

#### 1.4 確認部署成功

```bash
# 查看狀態
fly status

# 查看日誌
fly logs

# 開啟應用
fly open
```

你的 Backend API 會在：`https://pocketfund-backend.fly.dev`

---

### Step 2: 部署 Frontend

#### 2.1 更新 nginx.conf 的 Backend URL

編輯 `frontend/nginx.conf`，將所有 `proxy_pass` 改成你的 Backend URL：

```nginx
proxy_pass https://你的backend名稱.fly.dev;
```

例如：
```nginx
proxy_pass https://pocketfund-backend.fly.dev;
```

#### 2.2 進入 frontend 目錄

```bash
cd frontend
```

#### 2.3 初始化 Fly 應用

```bash
fly launch --no-deploy

# 系統會問你：
# - App name: pocketfund-frontend (或自訂名稱)
# - Region: sin (Singapore) 或 nrt (Tokyo) - 建議與 Backend 同一區
# - Would you like to set up a PostgreSQL database? → No
# - Would you like to set up an Upstash Redis database? → No
```

#### 2.4 部署

```bash
fly deploy
```

#### 2.5 確認部署成功

```bash
# 查看狀態
fly status

# 開啟應用
fly open
```

你的 Frontend 會在：`https://pocketfund-frontend.fly.dev`

---

## 健康檢查設定

### Backend 健康檢查端點

需要在 Backend 新增健康檢查端點（如果還沒有）：

```typescript
// src/app.controller.ts
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

---

## 常用指令

### 查看應用狀態

```bash
# Backend
fly status -a pocketfund-backend

# Frontend
fly status -a pocketfund-frontend
```

### 查看即時日誌

```bash
# Backend
fly logs -a pocketfund-backend

# Frontend
fly logs -a pocketfund-frontend
```

### 查看環境變數

```bash
fly secrets list -a pocketfund-backend
```

### 更新環境變數

```bash
fly secrets set KEY=VALUE -a pocketfund-backend
```

### 重啟應用

```bash
fly restart -a pocketfund-backend
```

### SSH 進入容器（除錯用）

```bash
fly ssh console -a pocketfund-backend
```

---

## 自訂網域設定（選用）

### 1. 新增 CNAME 記錄

在你的 DNS 服務商新增：

```
api.yourdomain.com  CNAME  pocketfund-backend.fly.dev
app.yourdomain.com  CNAME  pocketfund-frontend.fly.dev
```

### 2. 在 Fly.io 設定憑證

```bash
# Backend
fly certs add api.yourdomain.com -a pocketfund-backend

# Frontend
fly certs add app.yourdomain.com -a pocketfund-frontend
```

### 3. 等待 DNS 生效

```bash
fly certs check api.yourdomain.com -a pocketfund-backend
```

---

## 成本監控

### 查看用量

前往 [Fly.io Dashboard](https://fly.io/dashboard) 查看：
- VM 使用量
- 流量使用量
- 儲存空間使用量

### 免費額度提醒

```
✅ 免費：
- 3 個 shared-cpu-1x VM (256MB RAM)
- 3GB 持久化儲存
- 160GB 出站流量/月

⚠️ 超過會收費：
- 額外 VM: ~$2/月
- 額外流量: $0.02/GB
```

---

## 停止/刪除應用

### 停止應用（保留資源）

```bash
fly scale count 0 -a pocketfund-backend
```

### 刪除應用（釋放資源）

```bash
fly apps destroy pocketfund-backend
fly apps destroy pocketfund-frontend
```

---

## 疑難排解

### 問題 1: 部署失敗

```bash
# 查看詳細日誌
fly logs -a pocketfund-backend

# 檢查 Dockerfile 是否正確
fly doctor
```

### 問題 2: 健康檢查失敗

確認 Backend 有 `/health` 端點：

```bash
curl https://pocketfund-backend.fly.dev/health
```

### 問題 3: Frontend 無法連接 Backend

檢查 `frontend/nginx.conf` 的 `proxy_pass` URL 是否正確。

### 問題 4: 資料庫連線失敗

```bash
# 測試連線
fly ssh console -a pocketfund-backend
node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(e => console.error(e));"
```

---

## 本地測試 Docker 映像（選用）

### Backend

```bash
# 建立映像
docker build -t pocketfund-backend .

# 執行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-secret" \
  pocketfund-backend
```

### Frontend

```bash
# 建立映像
cd frontend
docker build -t pocketfund-frontend .

# 執行容器
docker run -p 8080:8080 pocketfund-frontend
```

---

## 更新部署

當你修改程式碼後：

```bash
# Backend
fly deploy -a pocketfund-backend

# Frontend
cd frontend
fly deploy -a pocketfund-frontend
```

Fly.io 會自動：
1. 建立新的 Docker 映像
2. 執行健康檢查
3. 零停機時間切換（rolling deployment）

---

## CI/CD 自動部署（進階）

可以使用 GitHub Actions 自動部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only -a pocketfund-backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## 總結

✅ **優勢**：
- 真正 0 成本（免費額度永久）
- 全球 CDN + 自動 HTTPS
- Cron Job 原生支援
- 零停機部署

✅ **適合場景**：
- Phase 2 個人/小團隊使用
- MVP 測試與驗證
- 輕量級生產環境

🚀 **下一步**：
- 監控應用效能
- 設定自訂網域
- 建立 CI/CD pipeline
