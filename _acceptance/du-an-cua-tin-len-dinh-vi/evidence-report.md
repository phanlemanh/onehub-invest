---
schema_version: 2
feature_slug: du-an-cua-tin-len-dinh-vi
verdict: BLOCKED
failed_evals: []
reason: |
  E7 (AC-7): lệnh `node pipeline/scripts/offer-project-that.mjs --hieu-nang` đã chạy đến cổng tải máy và tự thoát với mã 3: tải hệ thống 14.2 ≥ ngưỡng 14, nên không chạy kiểm. Đây là kết quả thật của script, không phải lỗi công cụ hay timeout. Không chạy lại nhiều lần để chờ pass; cần chạy lại khi tải máy xuống dưới 14.
  E9 (AC-9): lệnh `node pipeline/scripts/offer-project-that.mjs --chay-thu --ghi _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/so-chay-thu.md` đã chạy nhưng tự dừng bởi chốt tải máy: tải 1 phút 14.2 ≥ ngưỡng 14, nên không chạy kiểm (mã 3). Không có kết quả đạt hay hỏng nào. Chạy một lần theo đúng lệnh đã ghim, không chạy lại. Không phải lỗi công cụ hay timeout. Cần máy hạ tải rồi chạy lại.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 504d8a785e12185772e261fd51f7502b90415e53
human_signoff:
---

# Evidence Report: du-an-cua-tin-len-dinh-vi

Round 3. Hai eval đo trên DB máy thu (E7, E9) bị chốt tải máy chặn nên chưa có kết quả; chín eval còn lại đều xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | BLOCKED (chốt tải máy) |
| E8 | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | BLOCKED (chốt tải máy) |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E7
  run_id: minted-du-an-cua-tin-len-dinh-vi-E7-r3
  baseline: n-a
  verifier: config:executors.script.dv7_that_hieu_nang
  verified_at: 2026-11-15T11:22:36Z
  output: |
    [dv7] chế độ hieu-nang · DB localhost:5433/oneinvest · tải 1 phút 14.2 · 2026-11-15T11:24:26.359Z
    [dv7] tai-may: tải 14.2 ≥ 14 — không chạy
    Trạng thái: BLOCKED, script tự dừng ở chốt tải máy, chưa có phép đo nào.

- eval: E9
  run_id: minted-du-an-cua-tin-len-dinh-vi-E9-r3
  baseline: n-a
  verifier: config:executors.script.dv7_that_chay_thu
  verified_at: 2026-11-15T11:22:36Z
  output: |
    [dv7] chế độ chay-thu · DB localhost:5433/oneinvest · tải 1 phút 14.2 · 2026-11-15T11:24:26.049Z
    [dv7] tai-may: tải 14.2 ≥ 14 — không chạy
    Trạng thái: BLOCKED, script tự dừng ở chốt tải máy, chưa có phép đo nào.

- eval: E1
  run_id: minted-du-an-cua-tin-len-dinh-vi-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dv7 --chay node --test --test-concurrency=1 pipeline/tests/offer-project.itest.mjs
    ℹ duration_ms 40072.368916

- eval: E2
  run_id: minted-du-an-cua-tin-len-dinh-vi-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E5)
    ℹ duration_ms 40072.368916

- eval: E3
  run_id: minted-du-an-cua-tin-len-dinh-vi-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E5)
    ℹ duration_ms 40072.368916

- eval: E4
  run_id: minted-du-an-cua-tin-len-dinh-vi-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E5)
    ℹ duration_ms 40072.368916

- eval: E5
  run_id: minted-du-an-cua-tin-len-dinh-vi-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1–E5)
    ℹ duration_ms 40072.368916

- eval: E6
  run_id: minted-du-an-cua-tin-len-dinh-vi-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv7_that_doc
  verified_at: 2026-11-15T11:22:36Z
  output: |
    node pipeline/scripts/offer-project-that.mjs --doc
    [dv7] xung_dot (0): —

- eval: E10
  run_id: minted-du-an-cua-tin-len-dinh-vi-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_lui
  verified_at: 2026-11-15T11:22:36Z
  output: |
    bash db/db-thu.sh oneinvest_suite_dv7l --chay node --test --test-concurrency=1 pipeline/tests/offer-project-lui.itest.mjs
    ℹ duration_ms 164.462709

- eval: E11
  run_id: minted-du-an-cua-tin-len-dinh-vi-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_app
  verified_at: 2026-11-15T11:22:36Z
  output: |
    cd app && bash ../db/db-thu.sh oneinvest_suite_dv7a --chay node --import tsx --test --test-concurrency=1 tests/offer-project-app.itest.tsx tests/thang-bac-db.itest.tsx
    ℹ duration_ms 478767.51575

- eval: E8
  run_id: minted-du-an-cua-tin-len-dinh-vi-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-15T11:22:36Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1280 px, sáng, Toàn kho): phần «Chất lượng từng chặng» có style đầy đủ, bảng cuộn ngang tới cuối. Tiêu đề cột «Định vị (cấp dự án)» đọc trọn, nằm giữa «Gom cụm» và «Gắn căn», không bị cắt hay đè. Hàng S03: Định vị 4.934, 81%, 3.227 chờ khớp. Hàng S06: 11.574, 11%, 4.008 chờ khớp. Hàng S05: 0, 1 chờ khớp. Email thanh bên che bằng khối đen. Khớp Expected và kỳ vọng S03 all 4934.
    E8-step2.png (cửa sổ 7 ngày): cùng vị trí bảng. Hàng S03: Định vị 754, 75%, 507 chờ khớp. Hàng S06: 2.414, 765 chờ khớp. Hai hàng, vì S01 và S05 không có tin trong 7 ngày. Khớp kỳ vọng S03 7d 754. Email che.
    E8-step3.png (7 ngày, sơ đồ Đường ống): rê «Chưa định vị 17.582» hiện tooltip «Chưa khớp danh bạ: 1.272 tin ghi toà hoặc trục đang chờ khớp toà (kể cả tin đã định vị cấp dự án), 4.719 tin đủ định danh (mã căn, số nhà) đang chờ khớp căn; còn lại chưa có dự án...». Số 1.272 bằng 507 + 765 của locatedPending 7d. Email che. Không mâu thuẫn Expected.
  network_observed: clean
  ghi chú lệch khỏi steps: lệnh `npm run dev` gốc báo Turbopack «Could not find next/package.json» vì app/node_modules là symlink ra ngoài root worktree; verifier chép tạm node_modules bằng APFS clone để chạy đúng lệnh Turbopack rồi trả lại symlink gốc, không sửa mã. Bản chạy đầu dùng webpack nên mất CSS, ảnh đó bỏ; ảnh cuối chụp trên Turbopack. Khung chụp bằng playwright-cli trực tiếp (không qua scripts/ui-capture.sh) vì script đó đọc tài khoản admin còn lượt này cần vai ops. Server :3460 đã tắt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

- cmd: cd app && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-15T11:22:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay

Baseline khong do: evals.yaml không đổi từ lần đo baseline cuối (round 2); mọi block eval ghi baseline n-a.

Eval không-phân-biệt: không có.

## Variance

none — không eval nào chạy nhiều lần; mọi eval deterministic và đồng nhất.

## Iterations

Round 3: E7 và E9 chưa có kết quả vì chốt tải máy (tải 14.2, ngưỡng 14) chặn cả hai lệnh đo trên DB máy thu; chín eval còn lại xanh. Cần hạ tải máy rồi chạy lại hai lệnh, mỗi lệnh một lần. Lịch sử round 1 và 2 không nằm trong dữ liệu đầu vào của lượt soạn này.
