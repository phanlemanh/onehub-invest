#!/usr/bin/env bash
# migration.sh — E4 (AC-4): khuôn phát biểu trên DB của riêng lượt (áp tới 117 rồi 131); bản 131 bỏ luật khuôn thì ca từ chối đỏ.
source "$(dirname "$0")/_chung.sh"
MIG="$ROOT/db/migrations/131_ghep_truc_can_tren_tin.sql"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e4 --chay node --test --test-concurrency=1 --test-name-pattern='ghi-duoc|tu-choi|dinh-chinh|ap-lan-hai' tests/ghep-tin-truc-can-131.itest.mjs)
echo "== Khuôn phát biểu trên mã thật"; xanh "khuôn phát biểu 131" "${CHAY[@]}"
echo "== Đột biến"
dot_bien bo-luat-khuon-sub-id "tu-choi-sai-khuon" "$MIG" GHEP_MIG_131 "NEW.value !~ '^stk_[0-9A-Z]{26}:(\\*|[1-9][0-9]{0,2}[A-Z]?)\$' OR " "" "${CHAY[@]}"
echo "XANH: khuôn phát biểu và một đột biến"
