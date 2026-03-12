# Fly.io 快速部署腳本 - Backend (PowerShell)

Write-Host "🚀 開始部署 pocketfund Backend 到 Fly.io..." -ForegroundColor Green

# 檢查是否已登入
try {
    fly auth whoami | Out-Null
} catch {
    Write-Host "❌ 尚未登入 Fly.io，請先執行: fly auth login" -ForegroundColor Red
    exit 1
}

# 部署
Write-Host "📦 正在部署..." -ForegroundColor Yellow
fly deploy --config fly.toml

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "📊 查看狀態: fly status"
Write-Host "📝 查看日誌: fly logs"
