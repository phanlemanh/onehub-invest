---
schema_version: 1
feature: Sửa hồi quy bộ nạp S08 — snapshot chỉ căn thiếu 094 vẫn nạp và đánh dấu; snapshot có danh mục dự án hoãn khi thiếu 094
slug: s08-nap-sua
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-14T12:40:35Z
design_doc: docs/superpowers/specs/2026-11-14-s08-nap-sua-design.md
approved_by:
approved_at:
---

# Acceptance Contract: s08-nap-sua

## Context

Mục Ngoài-1 ở Cổng Bằng chứng của `stg-du-an-s08` (Mạnh «mở hợp đồng mới», 13/11): bộ nạp
`pipeline/import-airbnb.mjs` hoãn cả lượt nạp khi DB chưa áp migration 094, kể cả snapshot S08 chỉ có
căn — lượt thu S08 mất im lặng trên máy thu chưa áp 094. ZCode sửa trên nhánh `zcode/s08-nap-sua`
(b4414c4f); hồ sơ này đưa bản sửa vào main bằng cherry-pick, không viết lại logic. Lượt thu S08 kế là 22/11.

## Criteria

- AC-1: Given DB thử chưa có bảng `stg_s08_project` (thiếu 094) và một snapshot S08 chỉ có hai item
  `inventory_unit`, When chạy bộ nạp, Then thoát 0, không in `CHUA-AP-094`, `stg_s08_inventory` có đúng 2
  dòng của snapshot, và snapshot được đánh dấu đã nạp trong `airbnb_snapshots` (1 dòng).
- AC-2: Given DB thử thiếu 094 và một snapshot S08 có item `project_catalog`, When chạy bộ nạp, Then thoát 0,
  in `CHUA-AP-094`, và snapshot KHÔNG được đánh dấu (0 dòng `airbnb_snapshots`) để áp 094 rồi nạp lại đủ.
- AC-3: Given DB thử đã áp chính tệp `db/migrations/094_stg_s08_du_an.sql` và một snapshot có hai dự án
  (một kèm chi tiết), When nạp hai lần, Then lượt một ghi 2 dòng `stg_s08_project` (dòng có chi tiết mang
  `detail_payload`), lượt hai không nhân dòng.
- AC-4: Given tệp test `pipeline/tests/s08-danh-muc-nap.test.mjs` vừa vào `npm test`, When chạy bộ canh chia
  nửa, Then hợp hai nửa của `pipeline/test-nua.json` bằng đúng tập tệp `npm test`, không thiếu, không trùng.

- AC-5: Given tệp test `pipeline/tests/s08-danh-muc-nap.test.mjs` (có `DROP TABLE stg_s08_project CASCADE`), When chạy
  nó với một `DATABASE_URL` mà tên DB không khớp `^oneinvest_suite_[a-z0-9_]+$` — gồm các cách viết khác nhau cùng trỏ DB
  máy thu `oneinvest` (`postgresql://`, có `?sslmode=…`, host `127.0.0.1`, không mật khẩu) và DB thử không mang tiền tố
  suite — Then tệp thoát 2 trước khi nối DB, in lý do mà không in URL; DB suite thì chạy bình thường. Chốt chặn là hàm
  dùng chung `pipeline/lib/db-thu-chot.mjs` (nâng phạm vi ở Cổng Bằng chứng 14/11, Ngoài-1/3/4/6).

## Coverage

Bỏ quét không gian — một điều kiện rẽ nhánh hai trục rời rạc, liệt tay đủ (dòng `descope` trong sổ):

- Trục snapshot: chỉ căn · có danh mục dự án
- Trục DB: thiếu 094 · có 094
- Ô (chỉ căn, thiếu 094) → AC-1 · (có danh mục, thiếu 094) → AC-2 · (có danh mục, có 094) → AC-3 ·
  (chỉ căn, có 094) đi nhánh `coS08DanhMuc && coBang094` của `import-airbnb.mjs`, dòng mã không đổi ở hồ sơ này — không thêm ca đo.
- Trục bộ test: tệp mới vào đúng một nửa → AC-4.
- Trục an toàn DB của test: tên DB suite · DB máy thu viết nhiều cách · DB thử không tiền tố suite → AC-5.

## Out of scope

- Snapshot LẪN danh mục và căn khi thiếu 094 (hoãn cả căn) — hành vi AC-6 của `stg-du-an-s08`, điều kiện
  không đổi ở hồ sơ này, không thêm ca đo mới.
- Cho ba ca S08 chạy được trên CI (cấp DB thử cho tệp test ở CI): việc của bộ test làn thu.
- Áp 094 lên máy thu, nạp lại các snapshot S08 đã bị bỏ: bước vận hành sau gộp.
- Mọi đổi logic thu/nạp khác của `import-airbnb.mjs`: làn ZCode.

## Notes

- Giới hạn có tên: trên CI tệp test tự bỏ qua (không có DATABASE_URL) — ba ca S08 chỉ đo ở lượt chấm trên máy; việc phụ gửi làn thu cấp DB thử cho tệp test trên CI.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-14:
  - Ngoài-2: trên CI ba ca S08 không chạy (thiếu DATABASE_URL thì tệp tự bỏ qua) mà vẫn báo xanh; chỉ lượt chấm trên máy đo được.
  - Ngoài-5: trùng Ngoài-2 — lỗi hồi quy nạp S08 có thể lọt qua CI.
  - Ngoài-7: dữ liệu căn trong test viết tay, không rút từ bộ thu thật; lệch khuôn giữa thu và nạp sẽ không bị test bắt.
