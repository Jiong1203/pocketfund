#!/bin/bash
# Fly.io 快速部署腳本 - Frontend

set -e

echo "🚀 開始部署 pocketfund Frontend 到 Fly.io..."

cd frontend

# 檢查是否已登入
if ! fly auth whoami > /dev/null 2>&1; then
    echo "❌ 尚未登入 Fly.io，請先執行: fly auth login"
    exit 1
fi

# 部署
echo "📦 正在部署..."
fly deploy --config fly.toml

echo "✅ 部署完成！"
echo "🌐 應用網址: https://$(fly info --config fly.toml -j | grep -o '"Hostname":"[^"]*"' | cut -d'"' -f4)"
echo "📊 查看狀態: fly status"
echo "📝 查看日誌: fly logs"
