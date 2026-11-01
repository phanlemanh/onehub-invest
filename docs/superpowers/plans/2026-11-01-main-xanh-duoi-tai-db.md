# main-xanh-duoi-tai-db — kế hoạch

**Spec:** `docs/superpowers/specs/2026-11-01-main-xanh-duoi-tai-db-design.md` · hợp đồng `_acceptance/main-xanh-duoi-tai-db/`

### Task 1: agent AC-10 áp lại chịu tải (independent: true) — phục vụ E1, E2, E3, E7, E9, E10

**Files:** `agent/tests/enrich-revert.test.ts`

- `apLaiChiuTai(c, sql, { lockTimeout = "5s", lanToiDa = 5, lui = 500 }) → Promise<number>`: SAVEPOINT + `SET LOCAL
  lock_timeout`, thử lại chỉ cho 40P01/55P03, lỗi ném mang `lan`.
- AC-10 gọi `apLaiChiuTai` thay `c.query` cho từng file migration; mọi assert khác giữ nguyên.
- Bốn ca mới trên advisory lock theo pid: hết chờ khoá, deadlock (B đặt deadlock_timeout 30s), chạm trần, lỗi không
  phải tải.
- Verify: `cd agent && node --import tsx --test --test-name-pattern="AC-10" tests/enrich-revert.test.ts`; phá thử: bỏ
  40P01 khỏi `MA_TAI` → ca deadlock đỏ mã 40P01.

### Task 2: app kiểm public theo dấu lượt (independent: true) — phục vụ E4, E5, E6, E8

**Files:** `app/tests/the-duyet-du-can-cu.test.tsx`

- `layMoc()`, `publicBiCham({ luocDo, nguon, bang, moc })`: đếm dòng sau mốc xid mang dấu lượt; `after` so với bảng
  toàn 0.
- describe «TD public chịu tải» trên lược đồ nháp `<S>_tai`: TD-TAI-1/2/3.
- Verify: `cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx`.
