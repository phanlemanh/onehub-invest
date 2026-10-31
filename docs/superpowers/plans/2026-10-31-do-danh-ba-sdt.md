# Kế hoạch thi công — do-danh-ba-sdt (SD5, T2)

**Mục tiêu:** năm kiểm trục SĐT của danh bạ Người (audit 30/10 N1–N5) theo nguồn S03/S05, ghi `dq_check_results` một dòng mỗi
kiểm mỗi ngày giờ máy thu, chạy ở bước cuối `scripts/cloud-sync.sh`, hiện trên `/ops/quality`. Hợp đồng
`_acceptance/do-danh-ba-sdt/contract.md` (Mạnh duyệt 31/10, Hỏi-1/2/3 theo khuyến nghị).

## Task 1 — Lệnh đo
- Files: `pipeline/do-danh-ba-sdt.mjs`, `pipeline/do-danh-ba-sdt.test.mjs`, `pipeline/CLAUDE.md`
- `tinhSo` thuần (N1–N5), `xepTrangThai` (Hỏi-1), `veDong`, `docDuLieu` (READ ONLY), `ghi` (xoá-rồi-chèn theo ngày `Asia/Ho_Chi_Minh`).
- Verify: `node --test pipeline/do-danh-ba-sdt.test.mjs` · phục vụ E1 · independent: true

## Task 2 — Nhịp chạy
- Files: `scripts/cloud-sync.sh` — bước `job_run` cuối, sau `bac-du-lieu`.
- Verify: `bash _acceptance/do-danh-ba-sdt/probes/job.sh` · phục vụ E4 · independent: true

## Task 3 — Bên đọc ở app
- Files: `app/src/lib/dq-labels.ts`, `app/tests/dq-danh-ba-sdt-label.test.tsx`, `CONTEXT.md`
- Verify: `cd app && node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx` · phục vụ E5, E5b · independent: false (dùng `veDong`)

## Task 4 — Phép đo DB + phạm vi
- Files: `_acceptance/do-danh-ba-sdt/probes/{db.mjs,db.sh,on12.sh,job.sh,pham-vi.sh}`, `_acceptance/config.yaml` (khoá `ddb_*`, P4-105)
- Verify: `bash _acceptance/do-danh-ba-sdt/probes/db.sh` · phục vụ E2, E3, E5b, E6
