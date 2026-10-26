---
schema_version: 1
feature: test DB theo lược đồ sau 044 — DP-AC-5 xoá cột PII trên bảng bản ghi, test không áp lại 044 khi DB đã có
slug: deals-phi-ly-test-theo-view
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-26T11:57:18Z
approved_by:
approved_at:
---

# Acceptance Contract: deals-phi-ly-test-theo-view

## Context

Hồi quy trên main 432d7ca7 do #132 (PL14, migration 044). Từ 044, `sale_offers` và `listings` là VIEW sống trên
`sale_offer_records`/`listing_records`; DB local đã áp 044 ngay sau merge. Hai hệ quả trong bộ test:

- Ca «DP-AC-5 bản cloud» (`app/tests/deals-phi-ly.test.tsx`, hồ sơ deals-loai-tin-phi-ly) giả lập lược đồ cloud bằng
  `ALTER TABLE sale_offers DROP COLUMN …` — trên VIEW thì đỏ ổn định (42809), chặn S4 của dãy U1.
- `pipeline/scripts/write-offers.test.mjs` và thước `pipeline/scripts/nap-lai-ba-luot.mjs` LUÔN áp lại 044 trong giao
  dịch. Trên DB đã có 044, việc đó chỉ là DDL khoá độc quyền trên view sống, deadlock với test của phiên khác đang đọc
  DB dùng chung (đo 26/10: ON12-AC-5 đỏ 40P01, tiến trình chờ AccessExclusive trên view `listings`).

Không đổi hành vi sản phẩm: chỉ test và thước.

Giám sát đợt dot0-cam-mau xếp hàng `deals-phi-ly-test-theo-view` vào P2 (26/10, ưu tiên trước PL15).

## Criteria

- AC-1: Given DB local đã áp 044, When chạy trọn `cd app && npm test`, Then exit 0 và ca «DP-AC-5 bản cloud» xanh.
  - Ca xoá cột `PII_EXCLUDE.sale_offers` trên bảng thật `sale_offer_records`, dựng lại view sống `sale_offers` và hai
    view thước (034) trong giao dịch.
  - Vế đối chứng giữ nguyên: bản đầy đủ chạy trên lược đồ đã xoá cột phải lỗi.
  - DB trước 044 (sale_offers là bảng): đường cũ, xoá thẳng trên bảng.
- AC-2: Given DB local đã áp 044, When chạy `cd pipeline && npm test` (gồm write-offers.test.mjs), Then exit 0 và
  write-offers.test.mjs không áp lại 044 (chỉ nạp 033 + 036); DB chưa áp 044 thì vẫn nạp đủ 033+036+039+044.
- AC-3: Given DB local đã áp 044, When chạy `node pipeline/scripts/nap-lai-ba-luot.mjs`, Then dòng cuối «ĐẠT»
  (bản thật mất 0; hai đối chứng thấy mất) và thước không áp lại 044.

## Out of scope

- Đối chứng 039 của thước ba lượt vẫn chạy DDL (dựng khoá ngoại CASCADE trong giao dịch) — bản chất của đối chứng.
- `pipeline/scripts/nap-lai-db.itest.mjs` vẫn áp 044 hai lần có chủ đích (đo idempotent của chính migration); không nằm
  trong `npm test`.
- `data-api/` dùng DB và migration riêng.

## Notes

- Quét 26/10: ngoài DP-AC-5 không test nào trong app/agent/pipeline ALTER/DROP/TRUNCATE trên `sale_offers`/`listings`;
  `check-cloud-sync.mjs` chỉ đụng DB mô phỏng và đã vẽ lại hình trước 044 (#132).
