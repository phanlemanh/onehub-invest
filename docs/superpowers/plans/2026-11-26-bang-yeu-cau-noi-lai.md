# Kế hoạch YC0 bang-yeu-cau-noi-lai

Hợp đồng: `_acceptance/bang-yeu-cau-noi-lai/contract.md` (10 AC, Mạnh duyệt 26/11). Thiết kế: design doc cùng slug. Tuần tự
(các task phụ thuộc nhau qua migration 136), `independent: false`.

| # | Việc | Tệp | Verify per-task | Phục vụ |
|---|---|---|---|---|
| 1 | Migration 136: bảng `inquiry_post_records`, view `inquiries`, mở `field_assertions_field_chk` (+listing_intent, kind, budget_min_vnd, budget_max_vnd) và trigger giá trị, hàm `resolve_inquiry_fields`; `pipeline/lib/nap-136.mjs` | `db/migrations/136_inquiry_post_records.sql`, `pipeline/lib/nap-136.mjs` | ca YC0-AC-1 qua `yc0_ac1` | E1 |
| 2 | Sổ: khối `inquiries` + bốn trường trục `assertion_field` trong `mappings.yaml`, sinh lại `vocab.generated.mjs`, `dq-enum-vocab.mjs`, `yeu-cau-vocab-db.mjs` (có ca đối chứng), CONTEXT, phụ lục ADR 11 câu | `pipeline/mappings.yaml`, `pipeline/lib/vocab.generated.mjs`, `pipeline/dq-enum-vocab.mjs`, `pipeline/scripts/yeu-cau-vocab-db.mjs`, `CONTEXT.md`, `docs/adr/0013-phu-luc-yeu-cau.md` | `yc0_vocab` | E2 |
| 3 | `phatBieuYDinh` (thuần) + đọc nhãn Haiku hợp lệ mới nhất (SQL) + ma trận 9 ca | `pipeline/lib/yeu-cau.mjs`, `pipeline/scripts/yeu-cau.test.mjs` | `yc0_unit` | E3 |
| 4 | `ghiYeuCau` mới: ghi phát biểu (replaceOwn + retractRule luật), upsert khung dòng, gọi `resolve_inquiry_fields`; nối transform-zalo sau bước tin rao; bỏ bước khi thiếu 136 | `pipeline/lib/yeu-cau.mjs`, `pipeline/transform-zalo.mjs` | ca YC0-AC-4..7 | E4–E7 |
| 5 | Nhánh Yêu cầu của 600_data_flow đọc `inquiries` khi có | `pipeline/sql/600_data_flow.sql`, `pipeline/refresh-data-flow.mjs` | ca YC0-AC-8 | E8 |
| 6 | Thước `do-yeu-cau.mjs --kiem` + test chiều đỏ | `pipeline/scripts/do-yeu-cau.mjs`, `pipeline/scripts/do-yeu-cau.test.mjs` | `yc0_do_that` trên bản chép | E9 |
| 7 | Hồi quy | — | suite pipeline a/b, app | E10–E12 |

Mỗi phép đo mới kèm cặp hai chiều cùng fixture + thông điệp ghim (MEASURE-BIRTH-CLAUSE). Không chạy suite nặng ngoài khoá s4
trên Mac mini; soát trên M5 bằng `soat-m5`.
