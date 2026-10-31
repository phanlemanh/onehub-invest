# Kế hoạch: do-the-duyet-du-du-lieu (HD11)

Hợp đồng: `_acceptance/do-the-duyet-du-du-lieu/contract.md` (duyệt 31/10, Hỏi-1..3 theo khuyến nghị). Khuôn: SD5
`pipeline/do-danh-ba-sdt.mjs`. Tuần tự trong vòng chính — các task chia nhau tệp nhưng task sau đọc hằng của task trước.

## Task 1 — lệnh `pipeline/do-the-duyet.mjs` + test

- Files: `pipeline/do-the-duyet.mjs`, `pipeline/do-the-duyet.test.mjs`
- Hàm thuần `tinhSo({ the, tin, media })` → bốn kiểm; `veDong` → dòng `dq_check_results`; `docDuLieu` (giao dịch chỉ
  đọc), `ghi` (xoá dòng hôm nay của bốn tên kiểm theo giờ máy thu rồi chèn, một giao dịch); CLI `--write`.
- Ảnh theo đúng luật của bộ đọc app `app/src/lib/ops/review-media.ts`: vai Vận hành thấy dòng `local_file` hợp khuôn
  (`<snapshot>/media/<tệp>`, cùng hai regex của `zalo-media.ts`); quản trị viên thấy thêm `media_url` http(s) và
  `evidence.<bên>.image_url` http(s).
- Độ đầy (Hỏi-2): bên còn sống, đếm theo `offer_id` khác nhau mỗi nguồn; 10 trường + người đăng.
- Verify: `node --test pipeline/do-the-duyet.test.mjs` (gồm ba bản chép đỏ có thông điệp ghim).
- Phục vụ E1, E3.
- independent: false

## Task 2 — bước cuối `scripts/cloud-sync.sh`

- Files: `scripts/cloud-sync.sh`, `scripts/job-exit.test.mjs` (dãy bước ghim — lỗi tích hợp như #228).
- Cần SD5 (#228) đã vào `main`; gộp `origin/main` vào nhánh trước task này.
- Verify: `bash -n scripts/cloud-sync.sh`, `node --test scripts/job-exit.test.mjs`.
- Phục vụ E4.
- independent: false

## Task 3 — nhãn `/ops/quality`

- Files: `app/src/lib/dq-labels.ts`, `app/tests/dq-the-duyet-label.test.tsx`, `CONTEXT.md`, `pipeline/CLAUDE.md`.
- Verify: `cd app && node --import tsx --test tests/dq-the-duyet-label.test.tsx`, `npx tsc --noEmit`, ca ON12.
- Phục vụ E5, E5b.
- independent: false

## Task 4 — phép đo trên DB thử + executors

- Files: `_acceptance/do-the-duyet-du-du-lieu/probes/{db.sh,db.mjs,job.sh,on12.sh,hom-nay.sh,hom-nay.tsx}`,
  `_acceptance/config.yaml` (bảy khoá `dtd_*`, yêu cầu chạm tệp P4-109).
- DB thử qua `db/db-thu.sh` (`oneinvest_p4_dtd`, xoá khi xong); không ghi DB :5433.
- Verify: chạy từng probe; mỗi probe có đối chứng đỏ ghim thông điệp.
- Phục vụ E2, E3, E4, E4b(AC-8), E5b, E6, E7.
- independent: false
