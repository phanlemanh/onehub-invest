# DA6 `khoa-gop-can-khong-gia` — kế hoạch thi công (T3, chờ Gate 1.5)

**Mục tiêu:** mỗi tin thuộc nhiều nhất một căn; đổi giá một tin không sinh căn mới.
**Thiết kế:** `docs/superpowers/specs/2026-11-12-khoa-gop-can-khong-gia-design.md` · hồ sơ `_acceptance/khoa-gop-can-khong-gia/`
(Cổng Phạm vi Mạnh duyệt 13/11, Hỏi-1…3 theo khuyến nghị). Cách thi công: Native, tuần tự (ba task chạm cùng bảng `property_offers`).

## Ràng buộc chung
- Migration số **098** (SO-MIGRATION cấp 12/11 cho P3), idempotent, một giao dịch; không xoá căn nào (M-1); không thêm cột vào `properties`.
- Không áp 098 lên DB `oneinvest` hay máy thu, không DDL cloud — hai lượt đó là lời riêng của Mạnh sau gộp (OOS-1, Hỏi-3).
- Test chỉ trên `db/db-thu.sh oneinvest_suite_kgc --chay` (DB của riêng lượt chép máy thu, xoá khi xong). Chạy đo nặng chỉ trong khoá s4.
- Khoá cụm (`CLUSTER_EXPR`, sáu đoạn, có giá) giữ nguyên.

## Review Focus
1. Tin đã gắn căn A rơi sang cụm mới mà cụm đó KHỚP một căn B có sẵn → không được gắn link thứ hai sang B (AC-5 chỉ đo cụm không khớp).
2. Cụm có cả tin đã gắn và tin chưa gắn → sinh căn mới (nếu không khớp) và chỉ gắn tin chưa gắn; `n_evidence` của căn mới tính theo gì — giữ `cl.n` như cũ (ghi rõ, không đổi nghĩa).
3. Hai cụm cùng lượt cùng nhắm một tin chưa gắn (không xảy ra vì mỗi tin một khoá cụm) — `ON CONFLICT DO NOTHING` vẫn chặn nếu có.
4. Áp 098 khi bảng nhật ký đã có dòng từ lần trước → lần hai không chép thêm (không còn link trùng để dọn).
5. Hàm nạp lại đổi khoá của 044 (`nap-lai`) chạy sau 098 → `ON CONFLICT DO NOTHING` bắt UNIQUE, không ném.

## Task 1 — Migration 098 (phục vụ E1, E2, E3)
**Files:** tạo `db/migrations/098_khoa_gop_can.sql`.
1. `CREATE TABLE IF NOT EXISTS property_offer_unlinks (property_id, offer_id, score, signals, linked_at, unlinked_at timestamptz
   DEFAULT now(), reason text)` — kiểu cột chép từ `property_offers`.
2. CTE xếp hạng `row_number() OVER (PARTITION BY offer_id ORDER BY p.created_at, p.id)` trên link JOIN `properties`; hạng > 1 →
   `INSERT INTO property_offer_unlinks … reason = 'DA6 gop: giu can tao som nhat'` rồi `DELETE` đúng các dòng đó (một câu `WITH … DELETE … RETURNING` chèn nhật ký).
3. `DO $$ … IF NOT EXISTS (pg_constraint conname = 'property_offers_offer_id_key') THEN ALTER TABLE … ADD CONSTRAINT … UNIQUE (offer_id)`.
- Kiểm: `/new-migration` bước áp hai lần trên DB thử.

## Task 2 — Resolver (phục vụ E4–E9)
**Files:** sửa `pipeline/resolve-properties.mjs`; chụp lại `pipeline/lib/thu-lai-deadlock.sql-base.json`.
- Câu cụm thêm `count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id))::int n_chua_gan`.
- Cụm không khớp `stable_key` và `n_chua_gan = 0` → bỏ qua (không tạo căn, không chèn link), đếm vào dòng log `bỏ <n> cụm toàn tin đã gắn`.
- Câu chèn link thêm `AND NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id)` và đổi
  `ON CONFLICT (property_id, offer_id) DO NOTHING` → `ON CONFLICT DO NOTHING`.
- Kiểm: `node --test pipeline/lib/thu-lai-deadlock.test.mjs` (E9) sau khi chụp lại.

## Task 3 — itest (phục vụ E1–E8)
**Files:** tạo `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`; khai lệnh `kgc_db`, `kgc_deadlock` trong `_acceptance/config.yaml` (đã có thì giữ).
- Thứ tự ca: KGC-AC-8 (trước 098) → AC-1 → AC-2 → AC-3 → AC-4 → AC-5 → AC-6 → AC-7, đúng mô tả E1–E8 của `evals.yaml`, gồm mọi chiều đỏ
  (SAVEPOINT + DROP ràng buộc rồi ROLLBACK; resolver bản gốc nạp từ `git show origin/main:pipeline/resolve-properties.mjs` vào tệp tạm).
- Kiểm: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kgc --chay node --test --test-concurrency=1 tests/resolve-properties-khoa-gop.itest.mjs`
  — chạy trong khoá s4 (chép DB máy thu, chạy resolver trên dữ liệu thật).

## Sau S3
Hồ sơ đã ký chạm `resolve-properties.mjs` (dong-bang-stage-b-resolve, resolve-thu-lai-deadlock) cần ghim lại sau gộp — báo GS (OOS-3).
