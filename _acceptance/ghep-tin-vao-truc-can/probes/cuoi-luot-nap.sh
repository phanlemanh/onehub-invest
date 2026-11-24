#!/usr/bin/env bash
# cuoi-luot-nap.sh — E8 (AC-8): bước gắn trục, căn cuối lượt nạp: thiếu 131, lỗi cấy, khoá bị giữ → đúng một dòng cảnh báo; nối sau bước gắn toà.
source "$(dirname "$0")/_chung.sh"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e8 --chay node --test --test-concurrency=1 --test-name-pattern='thieu-131|loi-khi-ghi|giu-khoa|transform-zalo' tests/ghep-tin-truc-can-ghi.itest.mjs)
echo "== Bước cuối lượt nạp trên mã thật"; xanh "bước cuối lượt nạp" "${CHAY[@]}"
echo "== Đột biến"
dot_bien nem-loi-ra-ngoai "loi-khi-ghi-in-mot-canh-bao-va-khong-nem" lib/ghep-tin-truc-can-ghi.mjs GHEP_CAN_GHI_LIB '    log(`JOB WARN [ghep-can] ${e.message}`);
  }
}' '    throw e;
  }
}' "${CHAY[@]}"
echo "XANH: bước cuối lượt nạp và một đột biến"
