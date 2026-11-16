# YC1 sửa bộ đọc ngân sách — kế hoạch thi công

**Spec:** `docs/superpowers/specs/2026-11-11-sua-doc-ngan-sach-yeu-cau-design.md` · hợp đồng
`_acceptance/sua-doc-ngan-sach-yeu-cau/contract.md` (duyệt 11/11).

## Task 1 — ma trận ca viết trước (đỏ trên bộ đọc gốc)

- Files: `pipeline/scripts/yeu-cau-ngan-sach.test.mjs`
- Bảng ca của hợp đồng thành mảng `CA` (chữ, dịch vụ, min, max, mã); hằng `TONG_CA` ghim; mỗi mã ≥ 2 ca (đỏ
  `THIEU CA <mã>`); mỗi ca so đúng min, max; không ca nào min > max (đỏ `MIN LON HON MAX`).
- Chiều đỏ: bản sao đột biến của `yeu-cau.mjs` chép cạnh tệp thật (đổi một luật), nhập động, xoá trong `finally`.
- Băm ngoài khối (AC-8): bỏ từ `// ---- Ngân sách` tới trước `// ---- Loại hình`, sha256, so hằng `BAM_NGOAI_KHOI`
  (băm của bản 6c4ee41d); đột biến một dòng ngoài khối → `NGOAI KHOI DOI`.
- Verify: `node --test pipeline/scripts/yeu-cau-ngan-sach.test.mjs` đỏ trên bộ đọc gốc.
- Phục vụ E1–E6, E8 · independent: false

## Task 2 — sửa khối ngân sách

- Files: `pipeline/lib/yeu-cau.mjs` (chỉ khối «Ngân sách»)
- Phần lẻ sau đơn vị, chặn chữ theo sau, khoảng đầu dưới thiếu đơn vị, giữ biểu thức đầu khi sàn/trần rời ngược, lưới
  min ≤ max cuối hàm, số trơn sau tc/tài chính/ngân sách theo dịch vụ.
- Verify: Task 1 xanh; `cd pipeline && npm test`.
- Phục vụ E1–E6, E8 · independent: false

## Task 3 — lệnh đo trên DB máy thu

- Files: `pipeline/scripts/do-ngan-sach-yeu-cau.mjs`
- `--goc <sha>`: dựng `pipeline/lib/.yeu-cau-goc-<pid>.mjs` từ `git show`, nhập, xoá; giao dịch chỉ đọc; bài S03 khớp
  `laYeuCau` (bản mới nhất mỗi post_id); in dòng `YCNS-DO …`, 30 mẫu đổi giá trị; thoát 1 khi mất > 0, giảm, thuê từ
  100 triệu, min > max. `--tu-kiem`: bộ ca dựng sẵn với bộ đọc làm rơi `tc 8tr` → thoát 1 `YCNS-DO MAT NGAN SACH`.
- Verify: `node pipeline/scripts/do-ngan-sach-yeu-cau.mjs --goc 6c4ee41d…` thoát 0; `--tu-kiem` thoát 1 đúng thông điệp.
- Phục vụ E7 · independent: true
