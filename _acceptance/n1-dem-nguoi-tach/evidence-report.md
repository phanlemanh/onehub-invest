---
schema_version: 2
feature_slug: n1-dem-nguoi-tach
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a124b0e91623a6a8a07fc6570e077754f5db53bf
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: n1-dem-nguoi-tach

Round 3. Chín eval E1–E9 giữ nguyên từ round 2 (carry-forward, delta không chạm paths của eval); sáu lệnh suite chạy lại ở round này, đều xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-n1-dem-nguoi-tach-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-1»: cặp một–một của người split → n1.so không đếm, n1.tong có đếm; ca đối chứng bỏ vế loại người đã tách → assert.throws /N1 DEM CA NGUOI DA TACH/

- eval: E2
  run_id: minted-n1-dem-nguoi-tach-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-2»: cặp split và cặp active cùng tập → n1.so = 1 (đúng cặp active); ca đối chứng vế loại nuốt mọi cặp → assert.throws /N1 NUOT NGUOI CHUA GOP/

- eval: E3
  run_id: minted-n1-dem-nguoi-tach-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «E1 ma trận năm số trên tập viết trước» không đổi số mong (S03 n1 so=1 tong=2, S05 n1 so=1 tong=1); ca «E1 đối chứng đỏ: đếm cả cặp đã gộp» vẫn xanh

- eval: E4
  run_id: minted-n1-dem-nguoi-tach-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-4»: tinhSo không có daTach deepEqual tinhSo với daTach rỗng

- eval: E5
  run_id: minted-n1-dem-nguoi-tach-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-5»: client giả → daGop = {pM}, daTach = {pS}; BEGIN TRANSACTION READ ONLY đầu, COMMIT cuối, câu split nằm giữa

- eval: E6
  run_id: minted-n1-dem-nguoi-tach-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-6»: veDong 11 dòng, dòng danh-ba-sdt:n1 S03 pass detail «so=0 tong=1», mẫu nhãn khớp app/src/lib/dq-labels.ts; đối chứng thêm « tach=1» → assert.throws /DETAIL N1 LECH NHAN OPS/

- eval: E7
  run_id: minted-n1-dem-nguoi-tach-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-7»: gộp rồi tách qua SQL.gop / SQL.tach → n1.so S03 = [1, 0, 0]

- eval: E8
  run_id: minted-n1-dem-nguoi-tach-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-8»: inBang in «danh-ba-sdt:n1 S03 cap_da_tach=2» và «danh-ba-sdt:n1 S05 cap_da_tach=0»; veDong vẫn 11 dòng, không detail nào chứa cap_da_tach; main in bằng inBang (đọc tĩnh)

- eval: E9
  run_id: minted-n1-dem-nguoi-tach-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ddb_pipeline
  verified_at: 2026-11-01T06:36:02Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: ca «N1T AC-9»: cặp một–một không bí danh + daTach khác rỗng → n1.so không đếm; đối chứng bỏ vế k != null → assert.throws /N1 DEM CAP KHONG NGUOI/

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-n1-dem-nguoi-tach-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-01T06:52:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-n1-dem-nguoi-tach-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-01T06:52:30Z

- cmd: cd app && npm test
  run_id: minted-n1-dem-nguoi-tach-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-01T06:52:30Z

- cmd: cd pipeline && npm test
  run_id: minted-n1-dem-nguoi-tach-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-01T06:52:30Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-n1-dem-nguoi-tach-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-01T06:52:30Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-n1-dem-nguoi-tach-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-01T06:52:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú baseline: chín eval E1–E9 là carry-forward từ round 2, round này baseline không đo lại (n-a). Sáu lệnh suite là regression-guard, baseline n-a.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: xem lịch sử round trước, đã trả về implementation.
Round 2: E1–E9 chạy, đều đạt; chuyển sang round 3 để chạy lại suite sau chỉnh sửa.
Round 3: sáu lệnh suite xanh; E1–E9 carry-forward từ round 2 (delta không chạm paths của eval); không có judgment item, không có panel nào cần người quyết.
