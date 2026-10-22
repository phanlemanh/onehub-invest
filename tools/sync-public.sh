#!/bin/bash
# sync-public.sh — đẩy 2 mảnh public từ monorepo private (ADR monorepo 22/10):
#   1. data-api: git subtree push → phanlemanh/onehub-data-api (nguyên nội dung)
#   2. app: copy app/ + overlay stubs (tools/public-overlay/) → đẩy
#      phanlemanh/onehub-invest-app — KHÔNG đẩy thôg (app private chứa
#      zalo-admin, queries thật; overlay thay bằng stub như sanitise 065ee2f)
# Chạy tay sau milestone: bash tools/sync-public.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "── 1. data-api subtree push…"
git subtree push --prefix=data-api https://github.com/phanlemanh/onehub-data-api.git main || {
  echo "⚠ subtree push fail (thường do history squash lệch) — dùng force push subtree"
  git push https://github.com/phanlemanh/onehub-data-api.git \
    "$(git subtree split --prefix=data-api main)":refs/heads/main --force
}

echo "── 2. app → onehub-invest-app (overlay sanitise)…"
TMP=$(mktemp -d)
rsync -a --delete --exclude node_modules --exclude .next --exclude .vercel \
  --exclude '*.env*' app/ "$TMP/app/"
if [ -d tools/public-overlay/app ]; then
  rsync -a tools/public-overlay/app/ "$TMP/app/"
fi
cd "$TMP/app"
[ -d .git ] || git clone https://github.com/phanlemanh/onehub-invest-app.git .gittmp \
  && mv .gittmp/.git . && rm -rf .gittmp
git add -A
git commit -m "sync từ monorepo onehub-invest @ $(git -C "$ROOT" rev-parse --short HEAD)" \
  --allow-empty
git push origin main
echo "✓ xong — public repos cập nhật"
