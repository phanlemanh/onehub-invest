#!/usr/bin/env bash
# chay-lai.sh — E6 (AC-6): chạy lại 0/0, đổi dữ liệu, tắt nguồn, câu rút «thay bởi lượt» chừa ghep-can-*.
source "$(dirname "$0")/_chung.sh"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e6 --chay node --test --test-concurrency=1 --test-name-pattern='luot-dau|chay-lai|rut-dong|thay-dong|tat-mot-nguon|tat-het-nguon|cau-rut|luot-nap-that-gan-can' tests/ghep-tin-truc-can-ghi.itest.mjs)
echo "== Vòng đời dòng trên mã thật"; xanh "chạy lại, đổi dữ liệu" "${CHAY[@]}"
echo "== Đột biến"
dot_bien bo-chua-ghep-can "cau-rut-thay-boi-luot-chua-dong-ghep-can" lib/assert.mjs GHEP_CAN_ASSERT_LIB " AND fa.rule_id NOT LIKE 'ghep-can-%'" "" "${CHAY[@]}"
# Finding S4 r2: đầu vào có bài mà 0 dòng (tắt hết nguồn) thì vẫn rút — trả lại chốt «0 dòng thì bỏ» phải làm ca tắt hết nguồn đỏ.
dot_bien bo-khi-khong-dong "tat-het-nguon-buoc-gan-van-rut-het-dong-cu" lib/ghep-tin-truc-can-ghi.mjs GHEP_CAN_GHI_LIB 'if (!dem.tong) return log(' 'if (!dong.length) return log(' "${CHAY[@]}"
echo "XANH: vòng đời và hai đột biến"
