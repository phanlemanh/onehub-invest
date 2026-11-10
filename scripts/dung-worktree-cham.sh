#!/usr/bin/env bash
# dung-worktree-cham.sh <worktree> [--khong-tsc] — dựng một worktree mới cho lượt chấm S4 (hồ sơ s4-suite-theo-vung).
#
#   1. .env: tệp chưa theo dõi của checkout chính mà .worktreeinclude khớp → chép sang khi đích chưa có (không ghi đè,
#      chỉ in đường, không in nội dung).
#   2. node_modules: thư mục có package.json (sâu ≤ 2) mà đích thiếu node_modules, checkout chính có → symlink.
#   3. app/.next/dev/types (tsc của app đọc nó): thiếu → next typegen rồi chép .next/types; không được → chép từ checkout
#      chính.
#   4. Kiểm tsc của app (bỏ bằng --khong-tsc); đỏ → thoát 1.
# Checkout chính = mục đầu của `git worktree list` (DUNG_WT_CHINH thay, cho test). Không bao giờ ghi vào checkout chính.
# Chạy lại không đổi gì: bước nào đã có thì bỏ qua.
set -uo pipefail

WT_ARG=${1:-}
TSC=1
[ "${2:-}" = "--khong-tsc" ] && TSC=0
if [ -z "$WT_ARG" ] || [ ! -d "$WT_ARG" ]; then
  echo "dùng: bash scripts/dung-worktree-cham.sh <worktree> [--khong-tsc]" >&2; exit 2
fi
WT=$(cd "$WT_ARG" && pwd -P)
CHINH=${DUNG_WT_CHINH:-$(git -C "$WT" worktree list --porcelain 2>/dev/null | awk 'NR==1 && $1=="worktree" {sub(/^worktree /,""); print}')}
[ -n "$CHINH" ] || { echo "dung-worktree-cham: không tìm được checkout chính của $WT" >&2; exit 2; }
CHINH=$(cd "$CHINH" && pwd -P)
if [ "$WT" = "$CHINH" ]; then
  echo "dung-worktree-cham: không dựng vào checkout chính ($CHINH)" >&2; exit 2
fi
echo "dung-worktree-cham: $WT ← $CHINH"

# 1. .env theo .worktreeinclude
INC="$WT/.worktreeinclude"; [ -f "$INC" ] || INC="$CHINH/.worktreeinclude"
if [ -f "$INC" ]; then
  while IFS= read -r rel; do
    case "$rel" in */node_modules/*|node_modules/*|.claude/worktrees/*) continue ;; esac
    if [ -e "$WT/$rel" ]; then echo "  giữ $rel (đích đã có)"; continue; fi
    mkdir -p "$WT/$(dirname "$rel")" && cp -p "$CHINH/$rel" "$WT/$rel" && echo "  chép $rel"
  done < <(git -C "$CHINH" ls-files -o -i --exclude-from="$INC" 2>/dev/null | grep -v '/node_modules/' | grep -v '^node_modules/')
else
  echo "  không có .worktreeinclude — bỏ bước .env"
fi

# 2. node_modules
LECH=0
while IFS= read -r pj; do
  d=$(dirname "$pj"); d=${d#./}
  [ -e "$CHINH/$d/node_modules" ] || continue
  if [ -L "$WT/$d/node_modules" ] && [ ! -e "$WT/$d/node_modules" ]; then echo "  CẢNH BÁO: $d/node_modules là symlink gãy"; continue; fi
  if [ -e "$WT/$d/node_modules" ]; then continue; fi
  # Lock lệch → KHÔNG nối: node_modules của checkout chính thiếu/khác gói, và npm ci qua symlink sẽ ghi vào checkout
  # chính (launchd chạy từ đó).
  if [ -f "$WT/$d/package-lock.json" ] && ! cmp -s "$WT/$d/package-lock.json" "$CHINH/$d/package-lock.json"; then
    echo "  lock lệch: $d — không nối node_modules; chạy «cd $d && npm ci» trong worktree"; LECH=1; continue
  fi
  ln -s "$CHINH/$d/node_modules" "$WT/$d/node_modules" && echo "  nối $d/node_modules → checkout chính"
done < <(cd "$WT" && find . -maxdepth 3 -name package.json -not -path '*/node_modules/*' | sort)

# 3. app/.next/dev/types
if [ -d "$WT/app" ]; then
  if [ ! -d "$WT/app/.next/dev/types" ]; then
    if [ -x "$WT/app/node_modules/.bin/next" ]; then (cd "$WT/app" && ./node_modules/.bin/next typegen >/dev/null 2>&1) || true; fi
    if [ -d "$WT/app/.next/dev/types" ]; then
      echo "  sinh app/.next/dev/types (next typegen)"
    elif [ -d "$WT/app/.next/types" ]; then
      mkdir -p "$WT/app/.next/dev" && cp -R "$WT/app/.next/types" "$WT/app/.next/dev/types" && echo "  sinh app/.next/dev/types (next typegen)"
    elif [ -d "$CHINH/app/.next/dev/types" ]; then
      mkdir -p "$WT/app/.next/dev" && cp -R "$CHINH/app/.next/dev/types" "$WT/app/.next/dev/types" && echo "  chép app/.next/dev/types từ checkout chính"
    else
      echo "  THIẾU app/.next/dev/types — chạy «cd app && npx next typegen» trong worktree"
    fi
  fi
fi

[ "$LECH" = 1 ] && { echo "dung-worktree-cham: worktree chưa đủ — còn thư mục lock lệch (bỏ kiểm tsc)"; exit 3; }

# 4. tsc
if [ "$TSC" = 1 ] && [ -d "$WT/app" ]; then
  out=$(cd "$WT/app" && npx tsc --noEmit 2>&1); rc=$?
  if [ $rc -eq 0 ]; then echo "tsc: xanh"; else
    n=$(printf '%s\n' "$out" | grep -c 'error TS')
    echo "tsc: đỏ ($n dòng lỗi)"; printf '%s\n' "$out" | grep 'error TS' | head -5; exit 1
  fi
fi
exit 0
