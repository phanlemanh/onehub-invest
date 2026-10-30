# sellers-them-dong-lai (SD1) — kế hoạch thi công

**Goal:** bước bait gap thêm dòng `sellers` cho mọi SĐT mới trên tin; đối chiếu danh bạ đọc SĐT trên tin.
**Spec:** `docs/superpowers/specs/2026-10-31-sellers-them-dong-lai-design.md` · hợp đồng `_acceptance/sellers-them-dong-lai/contract.md`.

## Global Constraints
- BEGIN…ROLLBACK + `pg_advisory_xact_lock(33033)` cho mọi test DB (khuôn `bait-gap-sellers.test.mjs`).
- Probe DB máy thu: `if (process.env.CI) return t.skip("<lý do>")`.
- Bản đột biến chép cạnh tệp thật (`pipeline/.tam-sellers-<pid>-<n>.mjs`), xoá trong `finally`.

## Review Focus
- SĐT có tin nhưng `first_seen` rỗng → INSERT vi phạm NOT NULL (bảng 022): CTE lấy `min(first_seen)` của view — view không có dòng rỗng.
- Lượt lặp không cộng dồn (AC-2).
- Dòng mồ côi vẫn bị xoá sau upsert (AC-4).

### Task 1: upsert ở `refreshBaitGap` (independent: false)
Files: `pipeline/refresh-bait-gap.mjs`, `pipeline/scripts/bait-gap-sellers.test.mjs`. Phục vụ E1–E5, E8.
- Viết ca SD-AC-1/2/3/5/8 kèm chiều đỏ (đột biến: bỏ thêm dòng · cộng dồn · ghi đè tên) → chạy đỏ trên mã cũ.
- Đổi bước 3 thành `INSERT … SELECT … ON CONFLICT (phone_hash) DO UPDATE … RETURNING (xmax = 0) AS moi`; trả thêm `sellersInserted`.
- Verify: `cd pipeline && node --test scripts/bait-gap-sellers.test.mjs`.

### Task 2: `sellersThieuNguoi` đọc `sale_offers` (independent: false)
Files: `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/scripts/bait-gap-sellers.test.mjs`, `pipeline/scripts/danh-ba-nguoi.itest.mjs`. Phục vụ E7.
- SQL: `SELECT DISTINCT seller_phone_hash || ':' || source FROM sale_offers WHERE seller_phone_hash IS NOT NULL AND NOT EXISTS (bí danh sdt_bam sống cùng nguồn)`.
- Ca AC-8 DB2b: chiều đỏ = tin S06 mang `hy` thêm sau `dungNguoi`.
- Verify: tệp trên + `NGUOI_DB_URL=<DB :5433> node --test scripts/danh-ba-nguoi.itest.mjs`.

### Task 3: probe chip Căn giá tốt (independent: false)
Files: `app/tests/sellers-chip.test.tsx`. Phục vụ E6.
- `dealsSql()` thật sau `refreshBaitGap` trong ROLLBACK; chiều đỏ bằng bản đột biến.
- Verify: `cd app && node --import tsx --test tests/sellers-chip.test.tsx`.
