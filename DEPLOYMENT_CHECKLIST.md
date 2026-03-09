# Fly.io 部署前檢查清單

在部署到 Fly.io 之前，請完成以下檢查：

---

## ✅ 本地測試

### 1. 測試健康檢查端點

重啟 dev server 後測試：

```bash
npm run dev
```

然後在瀏覽器或另一個終端機測試：

```bash
# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/health

# 或用瀏覽器開啟
# http://localhost:3000/health
```

預期回應：
```json
{
  "status": "ok",
  "timestamp": "2026-03-09T...",
  "service": "pocketfund-backend"
}
```

### 2. 測試 Docker 建置（選用）

確認 Docker 映像可以正常建置：

```bash
# Backend
docker build -t pocketfund-test .

# Frontend
cd frontend
docker build -t pocketfund-frontend-test .
```

---

## 📋 部署前準備

### Backend 環境變數

確認你有以下資訊：

- [ ] `DATABASE_URL` - Supabase PostgreSQL 連線字串
- [ ] `JWT_SECRET` - 強密碼（至少 32 字元）

### Frontend 配置

- [ ] 修改 `frontend/nginx.conf` 中的 Backend URL
- [ ] 確認所有 `proxy_pass` 指向正確的 Backend domain

範例：
```nginx
proxy_pass https://pocketfund-backend.fly.dev;
```

---

## 🚀 部署步驟

### 1. 部署 Backend

```bash
# 初始化
fly launch --no-deploy

# 選擇設定：
# - App name: pocketfund-yourname-backend (必須全球唯一)
# - Region: sin (Singapore) 或 hkg (Hong Kong) 或 nrt (Tokyo)
# - PostgreSQL?: No (我們用 Supabase)
# - Redis?: No

# 設定環境變數
fly secrets set DATABASE_URL="你的連線字串"
fly secrets set JWT_SECRET="你的密鑰"

# 部署
fly deploy

# 驗證
fly status
fly logs
curl https://你的app名稱.fly.dev/health
```

### 2. 更新 Frontend nginx.conf

編輯 `frontend/nginx.conf`：

```nginx
# 將所有 proxy_pass 改成你的實際 Backend URL
proxy_pass https://你的backend名稱.fly.dev;
```

### 3. 部署 Frontend

```bash
cd frontend

# 初始化
fly launch --no-deploy

# 選擇設定：
# - App name: pocketfund-yourname-frontend (必須全球唯一)
# - Region: sin (建議與 Backend 同區)
# - PostgreSQL?: No
# - Redis?: No

# 部署
fly deploy

# 驗證
fly status
fly open
```

---

## ✅ 部署後驗證

### Backend 檢查

```bash
# 1. 健康檢查
curl https://你的backend名稱.fly.dev/health

# 2. 測試註冊 API
curl -X POST https://你的backend名稱.fly.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test1234!"}'

# 3. 查看日誌
fly logs -a pocketfund-backend
```

### Frontend 檢查

```bash
# 1. 開啟網頁
fly open -a pocketfund-frontend

# 2. 測試登入功能
# 在瀏覽器中測試註冊/登入

# 3. 檢查 Console 是否有錯誤
# F12 開啟開發者工具
```

---

## 🔧 常見問題

### Q: 健康檢查失敗

**A**: 確認：
1. Backend 是否正常啟動（`fly logs -a pocketfund-backend`）
2. PORT 環境變數是否正確（應該是 3000）
3. `/health` 端點是否可訪問

### Q: Frontend 無法連接 Backend

**A**: 確認：
1. `frontend/nginx.conf` 的 `proxy_pass` URL 是否正確
2. Backend 的 CORS 設定是否允許 Frontend domain
3. Backend 是否正常運作

### Q: 部署時顯示 "app name already taken"

**A**: 應用名稱必須全球唯一，請改用：
- `pocketfund-yourname-backend`
- `pocketfund-202603-backend`
- 或其他唯一識別

### Q: 超過免費額度怎麼辦？

**A**: 
- 免費額度：3 個 256MB VM + 160GB 流量/月
- 如果只跑 Backend + Frontend，不會超過
- 可在 [Fly.io Dashboard](https://fly.io/dashboard) 監控用量

---

## 📊 成本監控

### 查看用量

前往 [Fly.io Dashboard](https://fly.io/dashboard) > Billing

確認：
- [ ] VM 數量 ≤ 3
- [ ] 每個 VM 記憶體 = 256MB
- [ ] 出站流量 < 160GB/月

### 停止應用（如不使用）

```bash
# 停止但不刪除
fly scale count 0 -a pocketfund-backend

# 完全刪除
fly apps destroy pocketfund-backend
```

---

## 🎉 部署成功！

恭喜！你的 pocketfund 已經成功部署到 Fly.io。

**下一步**：
- [ ] 測試所有功能（註冊、登入、建立基金、新增交易）
- [ ] 設定自訂網域（選用）
- [ ] 建立 CI/CD pipeline（選用）
- [ ] 監控應用效能

**有用的連結**：
- Backend: `https://你的backend名稱.fly.dev`
- Frontend: `https://你的frontend名稱.fly.dev`
- Dashboard: https://fly.io/dashboard
- 文件: https://fly.io/docs
