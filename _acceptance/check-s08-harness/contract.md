---
schema_version: 1
feature: bước kiểm local-only của check-s08-inventory chạy được trên main sau khi import-airbnb nhập import-s08-row
slug: check-s08-harness
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-30T07:32:16Z
approved_by:
approved_at:
---

# Acceptance Contract: check-s08-harness

## Context

`pipeline/scripts/check-s08-inventory.mjs local-only` (hồ sơ `stg-s08-inventory`, đã ký) chép `sync-cloud.mjs`,
`sync-pii.test.mjs`, `import-airbnb.mjs` sang thư mục tạm để thử đột biến FILL. Từ 26/10 (PL10 v2)
`import-airbnb.mjs` nhập `./import-s08-row.mjs`; tệp này không được chép nên M0 đỏ giả (ERR_MODULE_NOT_FOUND),
dù `sync-pii.test.mjs` chạy tại chỗ vẫn xanh. Phát hiện khi ZCode nạp S08 vào DB local (claudedp-2910-12): dữ liệu
đúng, chỉ bước kiểm đỏ. Vòng này chỉ sửa danh sách chép của script kiểm; mã sản phẩm không đổi.

Source input: tin XONG claudedp-2910-12 của ZCode (30/10) — «local-only FAIL 2 mục».

## Criteria

- AC-1: Given cây của nhánh, When chạy `node scripts/check-s08-inventory.mjs local-only` trong `pipeline/`, Then exit 0, in `S08 LOCAL-ONLY PASS`, có dòng `ok   M0 bản gốc: sync-pii.test xanh`.
- AC-2: Given cùng lượt chạy, When đọc dòng M1, Then đột biến cấy `stg_s08_inventory` vào FILL vẫn bị bắt: `ok   M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ` — bước kiểm còn răng, không xanh suông.
- AC-3: Given bản chép script kiểm bỏ `import-s08-row.mjs` khỏi danh sách chép (đúng dạng trên main trước bản sửa), When chạy local-only, Then M0 ĐỎ và lỗi nêu `import-s08-row.mjs` — chứng tỏ thiếu tệp này là nguyên nhân, bản sửa không che lỗi khác.
- AC-4: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có `pipeline/scripts/check-s08-inventory.mjs`, hồ sơ này, `_acceptance/config.yaml` và hai tệp máy sinh `PRODUCT-MAP.md`, `LO-TRINH.html` — KHÔNG tệp mã sản phẩm nào; và trong script kiểm chỉ đổi đúng dòng danh sách chép.

## Coverage

- Bỏ coverage-scan — vòng hẹp sửa một dòng script kiểm; trục rủi ro liệt kê thẳng: xanh thật (AC-1), còn răng (AC-2),
  đúng nguyên nhân (AC-3, đối chứng âm), không lén sửa mã (AC-4).

## Out of scope

- Sửa `import-airbnb.mjs`, `import-s08-row.mjs`, `sync-cloud.mjs` hay `sync-pii.test.mjs` — mã sản phẩm và test đúng.
- Thêm ca S08 vào `sync-pii.test.mjs` — ZCode gợi ý thế trong tin XONG, nhưng M1 đã cho thấy ca S08 có sẵn và bắt được.
- Đổi cách script kiểm dựng thư mục tạm (vd chép cả `pipeline/`) — giữ hình dạng đã ký, chỉ thêm tệp thiếu.
- Các chế độ khác của script (shape, real-name, reso) — không đổi.

## Notes

Lộ ở bước triển khai nạp S08 (ngoại lệ triển khai của ZCode trên checkout chính 2e25631c).
