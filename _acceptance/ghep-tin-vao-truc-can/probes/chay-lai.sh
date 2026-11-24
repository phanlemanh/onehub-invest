#!/usr/bin/env bash
# chay-lai.sh — E6 (AC-6): chạy lại 0/0, đổi dữ liệu, tắt nguồn, câu rút «thay bởi lượt» chừa ghep-can-*.
source "$(dirname "$0")/_chung.sh"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e6 --chay node --test --test-concurrency=1 --test-name-pattern='luot-dau|chay-lai|rut-dong|thay-dong|tat-mot-nguon|cau-rut' tests/ghep-tin-truc-can-ghi.itest.mjs)
echo "== Vòng đời dòng trên mã thật"; xanh "chạy lại, đổi dữ liệu" "${CHAY[@]}"
echo "== Đột biến"
dot_bien bo-chua-ghep-can "cau-rut-thay-boi-luot-chua-dong-ghep-can" lib/assert.mjs GHEP_CAN_ASSERT_LIB " AND fa.rule_id NOT LIKE 'ghep-can-%'" "" "${CHAY[@]}"
echo "XANH: vòng đời và một đột biến"
