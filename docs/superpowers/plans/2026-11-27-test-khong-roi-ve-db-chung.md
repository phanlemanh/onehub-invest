# HT35 test-khong-roi-ve-db-chung — Implementation Plan

Hồ sơ: `_acceptance/test-khong-roi-ve-db-chung/` (T2). Mọi task chạy tuần tự trong một worktree; `independent: false`.

### Task 1: Nhận bản zk
- Files: `pipeline/import-s09-danh-ba.test.mjs`
- Việc: cherry-pick 3cb318df3, giữ tác giả.
- Verify: `git diff 3cb318df3 -- pipeline/import-s09-danh-ba.test.mjs` rỗng ngay sau pick.
- Phục vụ: E6.

### Task 2: Rào chung cho test có ghi, có nhánh CI
- Files: `pipeline/lib/db-thu-chot.mjs`
- Việc: thêm hai hàm `urlCiChoPhep` và `urlDbTestGhi`, không đổi hàm cũ.
- Verify: RV-1.
- Phục vụ: E1, E2, E3.

### Task 3: Gắn rào vào hai tệp
- Files: `pipeline/import-s09-danh-ba.test.mjs` (lớp gọi), `scripts/check-freshness.test.mjs`
- Verify: RV-2, RV-3; chạy thật qua `db-thu` (E5).
- Phục vụ: E1–E5.

### Task 4: Ca đo
- Files: `pipeline/scripts/db-thu-chot.test.mjs`
- Việc: thêm RV-1, RV-2, RV-3.
- Phá thử: bỏ rào ở check-freshness thì RV-2 và RV-3 đỏ đúng thông điệp ghim.
- Phục vụ: E1–E4.

### Task 5: Lệnh chấm không chạy trần
- Files: `_acceptance/config.yaml`
- Việc: bọc bốn khoá bằng `db-thu`; thêm khoá `ht35_*`.
- Verify: `node scripts/kiem-ht35.mjs executor-db-thu`.
- Phục vụ: E7.

### Task 6: Bảng phủ, kèm phép kiểm tĩnh
- Files: `_acceptance/test-khong-roi-ve-db-chung/bang-phu.md`, `scripts/kiem-ht35.mjs`
- Verify: `zk-khop`, `bang-phu`. Phá thử: xoá một dòng bảng, trả một khoá về lệnh trần, thêm một dòng lạ vào tệp S09; mỗi
  lần đều đỏ đúng tên.
- Phục vụ: E6, E8.

Ghi chú thứ tự: mã được viết và đo trước khi hồ sơ xong. Lý do là GS giao với mốc PR trước 14:00Z. Hợp đồng và bộ eval ghi
đúng những gì đã đo; lượt chấm S4 trên M5 là người chấm độc lập.
