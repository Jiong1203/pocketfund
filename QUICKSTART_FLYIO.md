# Fly.io 部署快速入門

快速部署 pocketfund 到 Fly.io（0 成本方案）。

---

## ⚡ 3 步驟快速部署

### 1️⃣ 安裝並登入 Fly.io

**Windows (PowerShell)**:
```powershell
iwr https://fly.io/install.ps1 -useb | iex
fly auth login
```

**macOS/Linux**:
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 2️⃣ 部署 Backend

```bash
# 在專案根目錄執行
fly launch --no-deploy

# 設定環境變數
fly secrets set DATABASE_URL="你的Supabase連線字串"
fly secrets set JWT_SECRET="你的JWT密鑰"

# 部署
fly deploy
```

### 3️⃣ 部署 Frontend

**重要**: 先修改 `frontend/nginx.conf` 中的 Backend URL：

```nginx
# 將所有 proxy_pass 改成你的 Backend URL
proxy_pass https://你的backend名稱.fly.dev;
```

然後執行：

```bash
cd frontend
fly launch --no-deploy
fly deploy
```

---

## ✅ 驗證部署

```bash
# 查看 Backend 狀態
fly status -a pocketfund-backend

# 測試 Backend 健康檢查
curl https://你的backend名稱.fly.dev/health

# 開啟 Frontend
fly open -a pocketfund-frontend
```

---

## 📝 常用指令

```bash
# 查看即時日誌
fly logs -a pocketfund-backend

# 重啟應用
fly restart -a pocketfund-backend

# 查看環境變數
fly secrets list -a pocketfund-backend

# SSH 進入容器
fly ssh console -a pocketfund-backend
```

---

## 💡 提示

- **區域選擇**: 建議選 `sin` (Singapore) 或 `hkg` (Hong Kong)，延遲最低
- **應用名稱**: 必須全球唯一，建議加上自己的識別（如 `pocketfund-yourname-backend`）
- **免費額度**: 3 個 256MB VM，足夠 Phase 2 使用
- **Cron Job**: 你的 `@nestjs/schedule` 會自動運作，不需額外設定

---

## 🔧 疑難排解

### 問題: 部署失敗

```bash
# 查看詳細錯誤
fly logs -a pocketfund-backend

# 檢查 Docker 建置
fly doctor
```

### 問題: Frontend 無法連接 Backend

檢查 `frontend/nginx.conf` 的 `proxy_pass` URL 是否正確。

### 問題: 健康檢查失敗

確認 Backend 啟動成功：

```bash
fly ssh console -a pocketfund-backend
curl localhost:3000/health
```

---

## 📚 完整文件

詳細說明請參考：[DEPLOYMENT.md](./DEPLOYMENT.md)
