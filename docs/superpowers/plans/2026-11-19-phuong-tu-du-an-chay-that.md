# DA45 phuong-tu-du-an-chay-that — kế hoạch thi công

Hợp đồng: `_acceptance/phuong-tu-du-an-chay-that/contract.md` (đã duyệt 19/11). Thiết kế: `docs/superpowers/specs/2026-11-19-phuong-tu-du-an-chay-that-design.md`.

## Task 1 — chốt `--noi-tiep` trong lệnh ghi (phục vụ E2) · independent: true
- Files: `pipeline/scripts/phuong-tu-du-an.mjs`, `pipeline/scripts/phuong-tu-du-an.test.mjs`.
- `chay(client, { noiTiep })`: luật chưa có phát biểu sống nào thì in `chưa áp lượt đầu`, không ghi, trả `bo_qua: true`. Cờ dòng lệnh `--noi-tiep`.
- Test PCT-AC-2 trên DB thử từ migration: chưa áp → 0 chèn, cột không đổi, thoát 0, in câu ghim; đã áp → bài mới nhận phát biểu. Chiều đỏ: bản chép bỏ chốt.
- Verify: `cd pipeline && node --test scripts/phuong-tu-du-an.test.mjs` (qua `db/db-thu.sh` như npm test).

## Task 2 — nối bước vào chuỗi nạp (phục vụ E1) · independent: true
- Files: `scripts/zalo-import-daily.sh`, `scripts/phuong-tu-du-an-chuoi.test.mjs` (mới), bốn test ghim thứ tự: `scripts/enrich-buoc-job.test.mjs`,
  `scripts/zalo-import-job.test.mjs`, `scripts/zalo-import-job-nhe.test.mjs`, `scripts/job-step-thoi-luong.test.mjs`.
- Dòng mới ngay sau `transform-zalo`: `buoc zalo-import-daily phuong-tu-du-an node "$ROOT/pipeline/scripts/phuong-tu-du-an.mjs" --ghi --noi-tiep`.
- Test theo khuôn `zalo-import-job-nhe.test.mjs`: thứ tự ở hai lượt; bước giả lỗi; bước giả báo lock timeout. Chiều đỏ: bản sao script bỏ dòng.
- Verify: `node --test scripts/phuong-tu-du-an-chuoi.test.mjs scripts/enrich-buoc-job.test.mjs scripts/zalo-import-job*.test.mjs scripts/job-step-thoi-luong.test.mjs`.

## Task 3 — probe trên DB chép từ máy thu và hồ sơ áp (phục vụ E2–E7) · independent: false (cần Task 1)
- Files: `_acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh` (+ `.mjs`), `_acceptance/phuong-tu-du-an-chay-that/ap-may-thu/{README.md,sao-luu.sh,lui.sql,kiem-sau.sql,so-chay-thu.md}`.
- Probe chạy trên `db/db-thu.sh oneinvest_suite_pct --chay …` (chép bản mẫu từ máy thu), sáu chế độ: chot-luot-dau, chay-lai, tin-moi, ma-tran, ap-lui, thoi-gian.
- Verify: chạy từng chế độ, ghi số đo vào `so-chay-thu.md`.

## Task 4 — hồi quy
- `node --test scripts/*.test.mjs` và `cd pipeline && npm run test:a && npm run test:b`.
