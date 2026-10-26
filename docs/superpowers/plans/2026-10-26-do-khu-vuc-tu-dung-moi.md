# Phép đo gán khu vực tin rao tự dựng mồi — Implementation Plan

**Goal:** `kiem-tin-rao-gan-khu-vuc.mjs --thu` dựng trạng thái hỏng bằng tin mồi trong transaction, đo hai mốc thước
lệch, chứng dấu vết bằng băm; test ba chiều; E8 hồ sơ cũ khai thay bởi AC-2.

**Spec:** `docs/superpowers/specs/2026-10-26-do-khu-vuc-tu-dung-moi-design.md`, `_acceptance/do-khu-vuc-tu-dung-moi/contract.md`

## Global Constraints

- Mọi chạm DB trong BEGIN…ROLLBACK, khoá tư vấn 33033; từ chối DB không phải localhost. Không sửa transform.
- Băm bảng đọc ngoài transaction, trước và sau.

## Review Focus

- Nguồn nào không đủ hai tin hợp lệ ở Hà Nội sau lượt nền → FAIL có tên nguồn, không chọn ít hơn im lặng.
- Hai tin mồi cùng tên phường → mỗi tin vẫn một khu vực mồi riêng (id theo offer_id).
- `--pha mo-loc` phải trả meta cũ TRƯỚC chụp sau, kể cả khi transform ném lỗi.

### Task 1: script đo — phục vụ E1, E2, E4 · independent: false
- `scripts/kiem-tin-rao-gan-khu-vuc.mjs`: refactor `main()` + isMain; export `soBam(goc, sau) → string[]` (tên bảng lệch),
  `chayDo({ pha })` → mã thoát; luồng theo design §2 bước 0–6; cờ `--pha khong-sua|mo-loc`.
- Verify: `node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` PASS; `--pha khong-sua` và `--pha mo-loc` exit 1 đúng dòng.

### Task 2: test ba chiều + so băm + E8 — phục vụ E3, E4, E5 · independent: false
- `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`: KDM-AC-3 (spawn ba chiều), KDM-AC-4 so băm đỏ đúng bảng (thuần),
  KDM-AC-5 đọc evals.yaml cũ + design doc, chiều đỏ trên bản chép bỏ superseded_by.
- `_acceptance/tin-rao-gan-khu-vuc-dung/evals.yaml` E8: `status: not-run` + `superseded_by: do-khu-vuc-tu-dung-moi#AC-2`.
- `_acceptance/config.yaml`: `executors.test.tin_rao_gan_do_test`; sửa chú thích `tin_rao_gan_do`.
- `scripts/ci-bo-qua.json`: ca KDM-AC-3 (cần stg thật).
- Verify: `node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs` 3/3 pass, skipped 0.
