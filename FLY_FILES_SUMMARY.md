# Fly.io 部署檔案說明

本次為 pocketfund 新增了 Fly.io 部署所需的所有檔案。

---

## 📁 新增的檔案

### Backend 相關

| 檔案 | 用途 | 說明 |
|------|------|------|
| `Dockerfile` | Docker 映像定義 | 定義如何建置 Backend 的 Docker 映像 |
| `.dockerignore` | Docker 忽略檔案 | 排除不需要打包的檔案（node_modules、test 等）|
| `fly.toml` | Fly.io 配置 | Backend 部署配置（region、memory、health check）|
| `src/app.controller.ts` | 健康檢查端點 | 提供 `/health` API 給 Fly.io 檢查服務狀態 |
| `src/app.module.ts` | 更新模組 | 註冊 AppController |

### Frontend 相關

| 檔案 | 用途 | 說明 |
|------|------|------|
| `frontend/Dockerfile` | Docker 映像定義 | 定義如何建置 Frontend 的 Docker 映像（nginx）|
| `frontend/.dockerignore` | Docker 忽略檔案 | 排除不需要打包的檔案 |
| `frontend/fly.toml` | Fly.io 配置 | Frontend 部署配置 |
| `frontend/nginx.conf` | Nginx 配置 | 定義靜態檔案服務 + API proxy |

### 部署腳本（選用）

| 檔案 | 用途 | 說明 |
|------|------|------|
| `deploy-backend.sh` | Linux/macOS 部署腳本 | 快速部署 Backend |
| `deploy-backend.ps1` | Windows 部署腳本 | 快速部署 Backend |
| `deploy-frontend.sh` | Linux/macOS 部署腳本 | 快速部署 Frontend |
| `deploy-frontend.ps1` | Windows 部署腳本 | 快速部署 Frontend |

### 文件

| 檔案 | 用途 | 說明 |
|------|------|------|
| `QUICKSTART_FLYIO.md` | 快速入門 | 3 步驟快速部署指南 |
| `DEPLOYMENT.md` | 完整部署文件 | 詳細的部署步驟、常用指令、疑難排解 |
| `DEPLOYMENT_CHECKLIST.md` | 部署檢查清單 | 部署前/後的檢查項目 |
| `FLY_FILES_SUMMARY.md` | 本檔案 | 新增檔案的說明 |

### 其他更新

| 檔案 | 變更 | 說明 |
|------|------|------|
| `.gitignore` | 新增規則 | 忽略 `.fly/`、編輯器檔案、OS 檔案等 |
| `README.md` | 新增部署章節 | 加入 Fly.io 部署說明與連結 |

---

## 🚀 快速開始

### 1. 最快速（3 步驟）

參考 `QUICKSTART_FLYIO.md`：

```bash
# 1. 安裝並登入
fly auth login

# 2. 部署 Backend
fly launch --no-deploy
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy

# 3. 部署 Frontend（記得先改 nginx.conf）
cd frontend
fly launch --no-deploy
fly deploy
```

### 2. 完整流程

參考 `DEPLOYMENT.md` 獲得：
- 詳細的部署步驟
- 環境變數設定
- 健康檢查配置
- 自訂網域設定
- CI/CD 設定

### 3. 檢查清單

參考 `DEPLOYMENT_CHECKLIST.md` 確保：
- 本地測試通過
- 環境變數準備完成
- 部署後驗證成功

---

## 📋 部署前檢查

在執行部署前，請確認：

- [ ] Fly.io 帳號已註冊（需要信用卡驗證）
- [ ] Fly CLI 已安裝
- [ ] 已登入 Fly.io (`fly auth login`)
- [ ] Supabase 資料庫已建立並可連線
- [ ] 本地 dev server 可正常運作
- [ ] `/health` 端點可正常回應（重啟 dev server 後測試）

---

## 🔧 關鍵配置說明

### Backend fly.toml

```toml
app = "pocketfund-backend"      # 改成你的應用名稱（必須全球唯一）
primary_region = "sin"          # Singapore（或 hkg/nrt）

[http_service]
  internal_port = 3000          # 與 NestJS PORT 一致
  path = "/health"              # 健康檢查路徑
```

### Frontend nginx.conf

**重要**：部署前必須修改 Backend URL：

```nginx
proxy_pass https://你的backend名稱.fly.dev;
```

將所有 4 個 `proxy_pass` 都改成你實際部署的 Backend domain。

---

## 💰 成本說明

### 免費額度

```
✅ 永久免費：
- 3 個 shared-cpu VM (256MB RAM)
- 3GB 持久化儲存
- 160GB 出站流量/月

📊 你的配置：
- Backend: 1 VM (256MB) ✅
- Frontend: 1 VM (256MB) ✅
- 總計: 2 VM ✅ 在免費額度內
```

### 監控用量

前往 [Fly.io Dashboard](https://fly.io/dashboard) > Billing

---

## 🐛 疑難排解

### 部署失敗

```bash
# 查看詳細日誌
fly logs -a pocketfund-backend

# 檢查系統
fly doctor
```

### 健康檢查失敗

```bash
# SSH 進入容器檢查
fly ssh console -a pocketfund-backend
curl localhost:3000/health
```

### Frontend 無法連接 Backend

1. 檢查 `frontend/nginx.conf` 的 `proxy_pass` URL
2. 測試 Backend 是否正常：`curl https://你的backend.fly.dev/health`
3. 查看 Frontend 日誌：`fly logs -a pocketfund-frontend`

---

## 📚 延伸閱讀

- [Fly.io 官方文件](https://fly.io/docs)
- [Fly.io 定價說明](https://fly.io/docs/about/pricing/)
- [Fly.io 區域列表](https://fly.io/docs/reference/regions/)

---

## ✅ 下一步

部署成功後：

1. **測試所有功能**
   - 註冊/登入
   - 建立帳戶
   - 建立基金
   - 新增交易（儲值/支出）
   - 查看圖表

2. **設定監控**（選用）
   - 設定 Uptime 監控（如 UptimeRobot）
   - 設定錯誤通知

3. **自訂網域**（選用）
   - 參考 `DEPLOYMENT.md` 的自訂網域章節

4. **CI/CD**（選用）
   - 設定 GitHub Actions 自動部署

---

祝部署順利！🎉
