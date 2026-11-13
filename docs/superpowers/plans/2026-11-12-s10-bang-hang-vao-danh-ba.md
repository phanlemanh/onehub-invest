# DA29 s10-bang-hang-vao-danh-ba — kế hoạch thi công

**Mục tiêu:** bảng hàng S10 vào stg (089), nối dự án S10 vào nút danh bạ, đọc quỹ căn theo nút, chắn khỏi cloud/Bán/thước/metrics.
**Thiết kế:** `docs/superpowers/specs/2026-11-11-s10-bang-hang-vao-danh-ba-design.md` (Mạnh duyệt 12/11, Hỏi-1 A, Hỏi-2 A). Native, tuần tự.

### Task 1: Migration 089 (E1, E4; independent: false)
- Files: `db/migrations/089_s10_bang_hang.sql` — `stg_s10_stock` (đủ COT_S10, UNIQUE (snapshot_id, stock_id)), `stg_s10_project`
  (UNIQUE NULLS NOT DISTINCT (snapshot_id, project_id, project_label) — khoá ON CONFLICT của napS10Project), `s10_project_links`
  (khuôn 074), view `s10_quy_can_du_an` (DISTINCT ON stock_id theo captured_at).
- Verify: itest S10-AC-1 trong lượt s4.

### Task 2: `pipeline/transform-s10.mjs` (E3)
- Dùng lại `kiemBangNoi`, `kiemTep` của `noi-du-an-s08.mjs`; `docDuAnS10` lấy snapshot mới nhất mỗi project_id, `du_an` nhiều giá trị →
  `du-an-nhieu-ten`. Ghi `s10_project_links` một giao dịch, chạy lại không đổi `updated_at`.
- Verify: itest S10-AC-3.

### Task 3: `pipeline/scripts/transform-s10.itest.mjs` (E1–E4)
- Thứ tự: AC-2 đỏ (chưa 089) → AC-1 → AC-2 (nạp cả lượt 11/11, 120 snapshot, đếm bằng bocS10 độc lập) → AC-3 → AC-4.
- Verify: `executors.test.s10_db` trong lượt s4.

### Task 4: probe chặn (E5)
- Files: `_acceptance/s10-bang-hang-vao-danh-ba/probes/chan.sh` — quét năm gốc, tự chạy sáu ca đỏ/xanh trên cây tạm.
- Verify: `bash _acceptance/s10-bang-hang-vao-danh-ba/probes/chan.sh` → PASS (đã chạy).
