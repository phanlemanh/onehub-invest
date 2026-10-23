#!/bin/bash
# dev-ops-login-check.sh [base_url] — kiểm đầu-cuối tài khoản ops thử trên app dev ĐANG CHẠY
# (mặc định http://localhost:3456): chạy scripts/dev-ops-account.mjs, đăng nhập /login bằng
# curl (form server action), rồi kiểm cookie oi_session mở được /ops còn không cookie thì không.
# Không in mật khẩu: mật khẩu chỉ đi qua tệp tạm chmod 600, xoá khi thoát.
set -euo pipefail

base="${1:-http://localhost:3456}"
root="$(cd "$(dirname "$0")/.." && pwd)"
cred="$root/.claude/ops-test-account.json"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
umask 077

fail() { echo "FAIL: $*" >&2; exit 1; }

out="$(node "$root/scripts/dev-ops-account.mjs")"
echo "$out"

git -C "$root" check-ignore -q "$cred" || fail "tệp thông tin đăng nhập không bị git ignore"
perm="$(stat -f %Lp "$cred" 2>/dev/null || stat -c %a "$cred")"
[ "$perm" = "600" ] || fail "quyền tệp thông tin đăng nhập là $perm, cần 600"

node -e 'const j=require(process.argv[1]); process.stdout.write(j.password)' "$cred" > "$tmp/pw"
email="$(node -e 'process.stdout.write(require(process.argv[1]).email)' "$cred")"
[ -s "$tmp/pw" ] || fail "tệp thông tin đăng nhập không có mật khẩu"
if printf '%s' "$out" | grep -qF -f "$tmp/pw"; then fail "mật khẩu lộ ra stdout của dev-ops-account.mjs"; fi

# Form đăng nhập là server action: POST multipart kèm trường ẩn $ACTION_ID_<id> của trang.
curl -sf "$base/login" -o "$tmp/login.html" || fail "không GET được $base/login — dev server chưa chạy?"
aid="$(grep -o 'name="\$ACTION_ID_[0-9a-f]*"' "$tmp/login.html" | head -1 | sed 's/^name="//; s/"$//')"
[ -n "$aid" ] || fail "không thấy trường \$ACTION_ID_ trong form /login"

code="$(curl -s -o /dev/null -c "$tmp/jar" -D "$tmp/hdr" -w '%{http_code}' \
  -F "$aid=" -F "email=$email" -F "password=<$tmp/pw" -F "next=/ops/sources" "$base/login")"
[ "$code" = "303" ] || fail "POST /login trả $code, cần 303"
grep -qi '^set-cookie: oi_session=[0-9a-f]\{64\};.*httponly' "$tmp/hdr" || fail "POST /login không trả cookie oi_session HttpOnly"
echo "POST /login: 303, có cookie oi_session HttpOnly"

with="$(curl -s -o /dev/null -b "$tmp/jar" -w '%{http_code}' "$base/ops/sources")"
[ "$with" = "200" ] || fail "/ops/sources có cookie trả $with, cần 200 (user không còn role admin?)"
without="$(curl -s -o /dev/null -w '%{http_code}' "$base/ops/sources")"
[ "$without" != "200" ] || fail "/ops/sources KHÔNG cookie vẫn trả 200"
echo "/ops/sources: có cookie 200, không cookie bị chặn"
echo "OK: tài khoản ops thử đăng nhập được $base"
