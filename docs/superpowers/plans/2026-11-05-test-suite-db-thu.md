# Kế hoạch: test-suite-db-thu

Hồ sơ `_acceptance/test-suite-db-thu/` (T2). Làm tuần tự, các task phụ thuộc nhau nên không tách song song.

## Task 1: chế độ `--chay` của `db/db-thu.sh`

- Files: `db/db-thu.sh`, `scripts/db-thu.test.mjs`
- Verify: `node --test scripts/db-thu.test.mjs`
- Phục vụ: E1, E1b, E1c
- independent: false

## Task 2: lối vào của ba bộ và các đường còn trỏ DB chung

- Files: `app/package.json`, `pipeline/package.json`, `agent/package.json`, `app/tests/slo-mot-nguon.test.tsx`, `app/tests/quyen-bon-vai.test.tsx`, `app/tests/trang-chi-tiet-tin-db.test.tsx`, `pipeline/scripts/capture-ops-facts.mjs`, `agent/tests/judge-chung.ts`, tệp test thiếu mốc của S06 trong `pipeline/scripts/`
- Verify: `node --test scripts/db-thu.test.mjs` (ca DT-AC-7), rồi `node _acceptance/test-suite-db-thu/probes/lay-mau.mjs <bộ> npm test`
- Phục vụ: E5, E6, E7, E8
- independent: false

## Task 3: ca gốc `SD-AC-6` khi có bên ghi song song

- Files: `_acceptance/config.yaml`, `_acceptance/test-suite-db-thu/probes/song-song.mjs`, `probes/that.sh`
- Verify: `bash _acceptance/test-suite-db-thu/probes/that.sh`; `node _acceptance/test-suite-db-thu/probes/song-song.mjs rieng`
- Phục vụ: E2, E3, E4, E9
- independent: false

## Task 4: tài liệu

- Files: `AGENTS.md`, `docs/ROADMAP.md`
- Verify: đọc lại
- Phục vụ: không eval
- independent: true
