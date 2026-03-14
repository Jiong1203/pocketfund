# Fly.io 部署與 CI/CD 指南

本文件整理部署設定與重要注意事項，供未來查閱使用。

---

## 架構概覽

```
GitHub (main branch)
        │ git push
        ▼
GitHub Actions
        │
        ├─ 部署 Backend ──→ pocketfund-backend.fly.dev
        │
        └─ 部署 Frontend ──→ pocketfund-frontend.fly.dev
                                      │ nginx proxy
                                      ▼
                              pocketfund-backend.fly.dev
```

---

## 設定了哪些東西

### Backend（`packages/backend/`）

| 檔案 | 說明 |
|------|------|
| `Dockerfile` | 多階段建置：`npm install` → `npm run build` → production image |
| `fly.toml` | App 名稱、區域（sin）、Port 3000、健康檢查 `/health` |
| Fly.io Secrets | `DATABASE_URL`、`JWT_SECRET` |

### Frontend（`packages/frontend/`）

| 檔案 | 說明 |
|------|------|
| `Dockerfile` | 建置 Vue app → 放進 nginx image |
| `nginx.conf` | SPA routing + proxy API 請求到 Backend |
| `fly.toml` | App 名稱、區域（sin）、Port 8080 |

### CI/CD（`.github/workflows/deploy.yml`）

| 設定 | 說明 |
|------|------|
| 觸發條件 | push 到 `main` branch |
| 部署順序 | Backend 先部署 → 成功後才部署 Frontend |
| 認證方式 | GitHub Secret `FLY_API_TOKEN` |

---

## 重要注意事項

### 1. 使用 `npm install`，不能用 `npm ci`

Monorepo 架構下，子目錄沒有自己的 `package-lock.json`。
`npm ci` 需要鎖定檔才能執行，缺少時會直接失敗。

```dockerfile
# 錯誤
RUN npm ci

# 正確
RUN npm install
```

### 2. nginx proxy 到 HTTPS 必須設定 SSL Server Name

nginx proxy 到 HTTPS upstream 時，必須在 SSL 握手階段帶上正確的 hostname。
缺少這些設定，nginx 會用原始 IP 進行連線，導致 SSL 握手失敗，回傳 502 Bad Gateway。

```nginx
location /auth {
    proxy_pass https://pocketfund-backend.fly.dev;
    proxy_ssl_server_name on;                         # 啟用 SNI
    proxy_ssl_name pocketfund-backend.fly.dev;        # SSL 握手時使用的 hostname
    proxy_set_header Host pocketfund-backend.fly.dev; # Fly.io 用 Host header 路由請求
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**每行的作用：**
- `proxy_ssl_server_name on` — 讓 nginx 在 SSL 握手時使用 SNI
- `proxy_ssl_name` — SNI 帶上的 hostname（必須與 SSL 憑證一致）
- `proxy_set_header Host` — Fly.io 靠 Host header 判斷要路由到哪個 app

### 3. Backend App 名稱必須與 nginx.conf 同步

如果 Fly.io Backend app 改名，`nginx.conf` 中有**三個地方**必須同步更新：

```nginx
proxy_pass https://你的Backend名稱.fly.dev;
proxy_ssl_name 你的Backend名稱.fly.dev;
proxy_set_header Host 你的Backend名稱.fly.dev;
```

### 4. FLY_API_TOKEN 必須設定在 GitHub Secrets

CI/CD 沒有這個 token 會直接失敗。

產生 token：
```bash
fly tokens create deploy -x 999999h
```

到 GitHub 新增：**Settings → Secrets and variables → Actions → New repository secret**
- Name：`FLY_API_TOKEN`
- Value：上面產生的 token

---

## 日常維護指令

```bash
# 查看 App 狀態
fly status -a pocketfund-backend
fly status -a pocketfund-frontend

# 查看即時 log
fly logs -a pocketfund-backend
fly logs -a pocketfund-frontend

# 手動部署（不透過 CI）
cd packages/backend && fly deploy
cd packages/frontend && fly deploy

# 更新環境變數
fly secrets set KEY="value" -a pocketfund-backend
fly secrets list -a pocketfund-backend

# 重啟 App
fly restart -a pocketfund-backend

# SSH 進入容器
fly ssh console -a pocketfund-backend

# 暫停 App（不刪除）
fly scale count 0 -a pocketfund-backend

# 刪除 App
fly apps destroy pocketfund-backend
```

---

## 故障排除

| 症狀 | 原因 | 解法 |
|------|------|------|
| 建置時 `npm ci` 失敗 | 子目錄沒有 `package-lock.json` | Dockerfile 改用 `npm install` |
| 部署時 401 Unauthorized | Fly.io builder 認證過期 | 執行 `fly auth logout` 再 `fly auth login` |
| API 請求回傳 502 | nginx SSL 握手失敗 | 加上 `proxy_ssl_server_name on` 和 `proxy_ssl_name` |
| 所有路由都 502 | Host header 錯誤 | `proxy_set_header Host` 設為 Backend domain |
| CI/CD 沒有觸發 | branch 名稱錯誤或缺少 Secret | 確認 workflow 觸發 branch 與 `FLY_API_TOKEN` Secret |

---

## Fly.io 免費額度

| 資源 | 限制 |
|------|------|
| VM 數量 | 3 個 × 256MB shared CPU |
| 出站流量 | 160 GB／月 |
| 本專案使用 | 2 個 VM（backend + frontend）✅ |

用量監控：https://fly.io/dashboard → Billing
