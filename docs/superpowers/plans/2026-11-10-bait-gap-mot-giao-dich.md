# Bait gap một giao dịch — kế hoạch thi công

> For agentic workers: thực thi tuần tự trong phiên (Native). Steps dùng checkbox.

**Goal:** phần bait gap của `refresh-bait-gap.mjs` chạy trong một giao dịch mở bằng khoá advisory chung, khi chạy riêng.

**Spec:** `docs/superpowers/specs/2026-11-10-bait-gap-mot-giao-dich-design.md` · hợp đồng `_acceptance/bait-gap-mot-giao-dich/`.

## Global Constraints

- Khoá: `SELECT pg_advisory_xact_lock(hashtext('refresh-bait-gap'))` — chuỗi `refresh-bait-gap` nguyên văn.
- `refreshBaitGap(c)` giữ nguyên chữ ký và thân.
- Test DB thật chạy qua `db/db-thu.sh --chay`, từ chối DB tên `oneinvest`.
- Thứ tự gộp: sửa `refresh-bait-gap.mjs` SAU khi PR #402 gộp (gộp `origin/main` vào nhánh trước task 3).

## Review Focus

1. Lượt chết sau câu đặt rỗng — AC-7 (task 1).
2. Hai lượt chồng nhau thật sự xếp hàng — AC-3 đo `pg_locks.granted = false` (task 1).
3. Người gọi trong giao dịch (`savepoint: true`) không bị COMMIT sớm — AC-5 (task 1).
4. Đường gọi mới ngoài giao dịch — AC-8 (task 2).
5. Test chập chờn vì thời gian — trần rộng (30 s, 120 s), đếm số lần đọc tối thiểu (task 1).

### Task 1: thước DB thật `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs` — independent: true — phục vụ E1–E5, E7

**Files:** Create `pipeline/scripts/refresh-bait-gap-khoa.itest.mjs`.

- [ ] Viết bảy ca theo `expected` của E1, E2, E3, E4, E5, E7 (giá trị canh 999.9, bản chép tệp ở thư mục tạm cạnh
  `pipeline/` để import tương đối còn đúng — tạo trong `pipeline/.tmp-rbk-<pid>/`, xoá sau).
- [ ] Chạy trên cây CHƯA sửa (`config:executors.test.refresh_bait_gap_khoa`): các ca E1, E3, E4, E5, E7 phải ĐỎ với thông
  điệp ghim (chiều đỏ của chính lời hứa trên vật thật), E2 đối chứng dương xanh.
- [ ] Commit.

### Task 2: phép quét đường gọi `pipeline/scripts/refresh-bait-gap-goi.test.mjs` — independent: true — phục vụ E8

- [ ] Quét theo `expected` của E8, đối chứng dương trên cây tạm. Chạy: xanh trên cây hiện tại (đường gọi duy nhất là
  `main` → `buocDem(c)`), đỏ ghim trên cây tạm.
- [ ] Commit.

### Task 3: sửa `pipeline/refresh-bait-gap.mjs` — independent: false (sau #402) — phục vụ E1–E7

- [ ] `git merge origin/main` sau khi #402 gộp.
- [ ] `buocDem`: `savepoint: false` → BEGIN · khoá · `refreshBaitGap` · COMMIT (lỗi → ROLLBACK, ném lại); `savepoint: true`
  → chỉ khoá. Giao dịch danh bạ Người: khoá ngay sau `mo`.
- [ ] Chạy task 1 (xanh toàn bộ, chiều đỏ trên bản chép vẫn đỏ), task 2, `cd pipeline && npm test`.
- [ ] Commit; hợp đồng `status: implemented`.
