#!/usr/bin/env bash
# cuoi-luot-nap.sh — E8 (AC-8): bước gắn trục, căn cuối lượt nạp: thiếu 131, lỗi cấy, khoá bị giữ → đúng một dòng cảnh báo; nối sau bước gắn toà.
source "$(dirname "$0")/_chung.sh"
CHAY=(bash ../db/db-thu.sh oneinvest_suite_pl36_e8 --chay node --test --test-concurrency=1 --test-name-pattern='thieu-131|loi-khi-ghi|giu-khoa|transform-zalo|luot-nap-that' tests/ghep-tin-truc-can-ghi.itest.mjs)
echo "== Bước cuối lượt nạp trên mã thật"; xanh "bước cuối lượt nạp" "${CHAY[@]}"
echo "== Đột biến"
dot_bien nem-loi-ra-ngoai "loi-khi-ghi-in-mot-canh-bao-va-khong-nem" lib/ghep-tin-truc-can-ghi.mjs GHEP_CAN_GHI_LIB '    log(`JOB WARN [ghep-can] ${e.message}`);
  }
}' '    throw e;
  }
}' "${CHAY[@]}"
# Đảo thứ tự hai bước trong transform-zalo: ca lượt nạp thật phải đỏ đúng thông điệp thứ tự (finding r1, AC-8).
dot_bien dao-thu-tu-hai-buoc "chạy trước bước gắn toà" transform-zalo.mjs GHEP_ZALO_TEP '      const { buocGhepToa } = await import("./lib/ghep-tin-danh-muc-ghi.mjs");
      await buocGhepToa(client);' '      const { buocGhepCan: gc0 } = await import("./lib/ghep-tin-truc-can-ghi.mjs");
      await gc0(client);
      const { buocGhepToa } = await import("./lib/ghep-tin-danh-muc-ghi.mjs");
      await buocGhepToa(client);' "${CHAY[@]}"
echo "XANH: bước cuối lượt nạp và hai đột biến"
