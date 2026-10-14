#!/bin/bash
# Botni kompyuterdan Cloudflare Tunnel orqali ishga tushiradi (server bo'lmaganda).
# Ishlatish: npm run local   (to'xtatish: Ctrl+C)
set -e
cd "$(dirname "$0")/.."
LOG=$(mktemp)
cloudflared tunnel --no-autoupdate --url http://localhost:${PORT:-3000} >"$LOG" 2>&1 &
TUNNEL=$!
trap 'kill $TUNNEL 2>/dev/null; rm -f "$LOG"' EXIT
echo "⏳ Tunnel ochilmoqda..."
for _ in $(seq 1 60); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1)
  [ -n "$URL" ] && break
  sleep 1
done
[ -z "$URL" ] && { echo "❌ Tunnel ochilmadi:"; cat "$LOG"; exit 1; }
sed -i '' "s#^WEBAPP_URL=.*#WEBAPP_URL=$URL#" .env
echo "✅ $URL"
npm start
