---
schema_version: 2
feature_slug: soat-tang-a-moi-duong-len-cloud
verdict: PENDING-JUDGMENT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7f993c9e0a596d53c15c13fbbfa94ca0785def9f
human_signoff:
---

# Evidence Report: soat-tang-a-moi-duong-len-cloud

Round 1. Mọi eval máy đều xanh. Còn một mục judgment (E8) chờ người chốt ở Cổng 2, nên verdict là PENDING-JUDGMENT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | judgment | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

- eval: E2
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

- eval: E3
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

- eval: E4
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

- eval: E5
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

- eval: E6
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

- eval: E6b
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E6b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs allow
    check-cloud-sync allow: OK

- eval: E7
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_pii_cot
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs pii-cot
    check-cloud-sync pii-cot: OK

- eval: E9
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd app && npm test
    ℹ duration_ms 10157.464833

- eval: E10
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 6844.418625

### Judgment

Hội đồng đề xuất (advisory, chờ người ở Cổng 2): PASS. Cả ba góc nhìn cùng kết luận mục runtime-map khớp ba tệp code ở cả bốn ý.

- eval: E8
  judged_by: judge panel (3 lens, fresh context)
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — Mục runtime-map khớp ba tệp code ở cả bốn ý. (1) sync-cloud (`scanSourceNames` → `guardValues`) và push-ops-facts (`factsChan` → `guardValues`) cùng dùng `tier-a-guard.mjs`. (2) Dòng `FACTS CHẶN [tầng A] <đường> <S0x>`, thoát mã 1, miễn `zaloGroups[i].name`, dòng chặn khi không có danh sách tên và chế độ `--kho` đều đúng với `factsChan`, `guardValues` và `main`. (3) `piiColumnLeaks` chạy ở pha gate trước khi đọc local và tráo, rồi chạy lại sau tráo. Đúng ba bảng có `CLOUD_ALLOW`, ba bảng tầng A phải rỗng, thông báo đúng định dạng, và `--kiem-cot` trả mã 1 khi có vi phạm. (4) Bản tin gửi `zaloAccounts[i].name = null` và bộ soát chặn nếu name khác null, đúng với Hỏi-1 = A.
    - operational-feasibility: PASS — Mục cloud-sync của runtime-map (dòng 112–139) khớp ba tệp code ở cả bốn điểm. (1) Cả sync-cloud (`scanSourceNames` qua `guardValues`) lẫn push-ops-facts (`factsChan` qua `guardValues`) dùng `tier-a-guard.mjs`, và lõi khớp tên là `findSourceNames` của `mask-source-names`. (2) Định dạng `FACTS CHẶN [tầng A] <đường> <S0x>`, dòng "không có danh sách tên", thoát mã 1, ví dụ `jobs[0].lastLine S02` và lệnh `--kho` đều khớp `factsChan` và `main`. (3) `piiColumnLeaks` chạy cả trước khi gửi (`gatePii`) lẫn sau tráo (`leakGate`), với đúng thông điệp `cột ngoài danh sách cho phép: <bảng>.<cột>` và `bảng tầng A có dòng: <bảng>=<n>`; phạm vi gồm 3 bảng `CLOUD_ALLOW` và 3 bảng `TIER_A_TABLES`, và `--kiem-cot` báo mã 1 khi có vi phạm. (4) `zaloAccounts[i].name = null` và dòng chặn `zaloAccounts[<i>].name tên tài khoản thu` khớp tài liệu.
    - spec-alignment: PASS — Mục runtime-map.md khớp code ở cả bốn ý. (1) sync-cloud và push-ops-facts đều import guardValues từ tier-a-guard.mjs. (2) Dòng `FACTS CHẶN [tầng A] <đường> <S0x>`, dòng chặn khi thiếu danh sách tên, thoát mã 1, `--kho` và việc người vận hành phải làm đều đúng với `factsChan` và `main`. (3) `piiColumnLeaks` chạy ở pha gate trước khi gửi và sau khi tráo, báo đúng hai chuỗi tài liệu nêu, chỉ cho ba bảng có CLOUD_ALLOW; `--kiem-cot` trả mã 1 khi có vi phạm. (4) `zaloAccounts[i].name = null` và dòng chặn khi tên còn lại khớp Hỏi-1 = A.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-npm_test-r1
  exit_code: 0
  verified_at: 2026-10-24T08:58:24Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T08:58:24Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T08:58:24Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-24T08:58:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline), chứng minh harness chứ chưa chứng minh feature. Nên viết lại để assert hành vi mới, hoặc xác nhận đây là regression-guard có chủ ý:

- `cd pipeline && npm test`: E1, E2, E3, E4, E5, E6, E10
- `cd pipeline && node scripts/check-cloud-sync.mjs allow`: E6b
- `cd app && npm test`: E9

Eval phân biệt được (baseline red): E7. E8 là judgment, baseline n-a. Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần, deterministic, không có pass_rate hỗn hợp.

## Iterations

Round 1: mọi eval máy đều xanh; E8 (judgment) chờ người ở Cổng 2. Verdict PENDING-JUDGMENT.
