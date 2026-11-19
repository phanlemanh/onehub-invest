# Kế hoạch thi công SM1 `so-so-tren-man-theo-ngay` (phần còn lại sau Cổng Phạm vi)

Hồ sơ: `_acceptance/so-so-tren-man-theo-ngay/`. Phần ghi số, màn và test đã có trên nhánh. Kế hoạch này phủ phần lối (b) của Hỏi-4 và các bước tới lượt chấm.

## Task 1 — Giữ dòng số mốc ở máy thu khi đồng bộ bảng

- Files: `pipeline/sync-cloud.mjs`, `pipeline/sync-cloud.test.mjs`.
- Làm: viết ca đỏ trước; thêm bộ lọc `check_name <> 's03-moc-ngay'` cho riêng `dq_check_results` trong `childFilterSql`. Không đụng phần quét, che tên nguồn và thứ tự bảng (U1 `che-ten` sửa chỗ khác của tệp này).
- Verify: `cd pipeline && node --test sync-cloud.test.mjs sync-pii.test.mjs`.
- Phục vụ: E6. `independent: false`.

## Task 2 — Đo lối (b) bằng câu đọc thật

- Files: `app/tests/so-moc-s03.test.tsx`.
- Làm: ca `SM1-AC-6 lối giữ ở máy thu` đọc `localReadSql` thật thay cho câu lọc viết trong test; cấy một dòng số mốc, dòng đó không có ở đầu ra; số dòng kiểm khác trước và sau bằng nhau; đột biến bỏ bộ lọc đỏ; khối `dataFlow` đủ chuỗi ngày.
- Verify: `bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-6`.
- Phục vụ: E6. `independent: false`, sau Task 1.

## Task 3 — Cập nhật tài liệu nền

- Files: `docs/ROADMAP.md` (§2 as-built, §4 dòng SM1).
- Verify: `git diff --stat docs/ROADMAP.md`.
- Phục vụ: luật cập nhật ROADMAP. `independent: true`.

## Task 4 — Lượt chấm

- Làm: chạy `/verify`; `next build` nhờ phiên có `node_modules` thật hoặc CI; xin lượt `s4`; soát dòng `__EXIT` của từng lệnh trước khi ghi verified; nhận main sau khi `che-ten` gộp và chạy lại test `sync-cloud`.
- Phục vụ: E1–E10. `independent: false`, sau Task 1–3.
