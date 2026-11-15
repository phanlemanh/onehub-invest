---
schema_version: 2
feature_slug: du-an-cua-tin-len-dinh-vi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3645a289f0413fbb09c070f787e460da2ed202d6
human_signoff: Mạnh 2026-11-16
---

# Evidence Report: du-an-cua-tin-len-dinh-vi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E7
  run_id: minted-du-an-cua-tin-len-dinh-vi-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv7_that_hieu_nang
  verified_at: 2026-11-15T12:05:20Z
  output: |
    [dv7] hiệu năng: {"600 nền ms":4026,"600 sau ms":5287,"tỉ lệ":1.31,"data_level_units nền ms":67,"data_level_units sau ms":1238}

- eval: E9
  run_id: minted-du-an-cua-tin-len-dinh-vi-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv7_that_chay_thu
  verified_at: 2026-11-15T12:05:20Z
  output: |
    Bảng số ghi vào _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/so-chay-thu.md kèm mốc giờ; lệnh kết thúc thành công.

- eval: E1
  run_id: minted-du-an-cua-tin-len-dinh-vi-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-du-an-cua-tin-len-dinh-vi-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-du-an-cua-tin-len-dinh-vi-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-du-an-cua-tin-len-dinh-vi-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-du-an-cua-tin-len-dinh-vi-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_db
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-du-an-cua-tin-len-dinh-vi-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dv7_that_doc
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-du-an-cua-tin-len-dinh-vi-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1280 px, sáng, Toàn kho): phần «Chất lượng từng chặng» có style đầy đủ, bảng cuộn ngang tới cuối. Tiêu đề cột «Định vị (cấp dự án)» đọc trọn, nằm giữa «Gom cụm» và «Gắn căn», không bị cắt hay đè. Hàng S03: Định vị 4.934, 81%, 3.227 chờ khớp. Hàng S06: 11.574, 11%, 4.008 chờ khớp. Hàng S05: 0, 1 chờ khớp. Email thanh bên che bằng khối đen. Khớp Expected và kỳ vọng S03 all 4934.
    E8-step2.png (cửa sổ 7 ngày): cùng vị trí bảng. Hàng S03: Định vị 754, 75%, 507 chờ khớp. Hàng S06: 2.414, 765 chờ khớp. Hai hàng, vì S01 và S05 không có tin trong 7 ngày. Khớp kỳ vọng S03 7d 754. Email che.
    E8-step3.png (7 ngày, sơ đồ Đường ống): rê «Chưa định vị 17.582» hiện tooltip «Chưa khớp danh bạ: 1.272 tin ghi toà hoặc trục đang chờ khớp toà (kể cả tin đã định vị cấp dự án), 4.719 tin đủ định danh (mã căn, số nhà) đang chờ khớp căn; còn lại chưa có dự án...». Số 1.272 bằng 507 + 765 của locatedPending 7d. Email che. Không mâu thuẫn Expected.
  network_observed: clean
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-du-an-cua-tin-len-dinh-vi-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_lui
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-du-an-cua-tin-len-dinh-vi-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dv7_app
  verified_at: 2026-11-15T11:22:36Z
  carried_from_round: 3
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

- cmd: cd app && npm test
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_a-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_b-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-du-an-cua-tin-len-dinh-vi-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-15T12:05:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay

Khong co eval nao khong-phan-biet duoc liet ke. Moi block eval ghi baseline n-a vi round nay khong do lai baseline.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: xem lich su round truoc, da tra ve implementation.
Round 2: xem lich su round truoc, baseline do lan cuoi o round nay.
Round 3: E1-E6, E8, E10, E11 PASS; E7 va E9 bi chan vi tai may.
Round 4: E7 va E9 chay lai tren may thu, PASS; cac eval con lai carry-forward tu round 3.
