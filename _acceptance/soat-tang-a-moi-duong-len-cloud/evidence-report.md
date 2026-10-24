---
schema_version: 2
feature_slug: soat-tang-a-moi-duong-len-cloud
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 70f180600dd7bc212079725f3b5d63d39b96dd27
human_signoff:
---

# Evidence Report: soat-tang-a-moi-duong-len-cloud

Vòng 2. Mọi eval máy đều xanh. Còn một mục judgment (E8) hội đồng đề xuất PASS nhưng chưa có người chốt, nên verdict giữ PENDING-JUDGMENT cho Cổng 2.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward từ round 1) |
| E2 | AC-2 | test | PASS (carry-forward từ round 1) |
| E3 | AC-3 | test | PASS (carry-forward từ round 1) |
| E4 | AC-4 | test | PASS (carry-forward từ round 1) |
| E5 | AC-5 | test | PASS (carry-forward từ round 1) |
| E6 | AC-6 | test | PASS (carry-forward từ round 1) |
| E6b | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | judgment | PASS (hội đồng đề xuất, chờ người chốt ở Cổng 2) |
| E9 | AC-9 | test | PASS (carry-forward từ round 1) |
| E10 | AC-10 | test | PASS (carry-forward từ round 1) |

## Evidence

- eval: E6b
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E6b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-10-24T09:10:39Z
  output: |
    check-cloud-sync allow: OK

- eval: E7
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_pii_cot
  verified_at: 2026-10-24T09:10:39Z
  output: |
    check-cloud-sync pii-cot: OK

- eval: E1
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-soat-tang-a-moi-duong-len-cloud-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:58:24Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Judgment

Panel đề xuất cho E8 (đủ bốn điều, khớp code). Phiếu của hội đồng chỉ là tham khảo, người chốt ở Cổng 2.

- eval: E8
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Hội đồng ba góc nhìn cùng đề xuất PASS, xem từng phiếu bên dưới.
  human_override:  # chi nguoi ghi

- domain-correctness: PASS — Mục cloud-sync trong runtime-map.md khớp code ở cả bốn ý. (1) Cả sync-cloud (qua scanSourceNames/entriesFromTokens) và push-ops-facts (qua factsChan) đều gọi guardValues của tier-a-guard.mjs. (2) Dòng `FACTS CHẶN [tầng A] <đường> <S0x>` và dòng "không có danh sách tên" đúng từng chữ, ra stderr, thoát 1, `--kho` in đúng câu "ops-facts khô: sạch, 0 chỗ chặn". (3) piiColumnLeaks khớp CLOUD_ALLOW (3 bảng) và TIER_A_TABLES, chạy ở gatePii trước khi đọc local và ở leakGate sau tráo, với đúng chuỗi thông báo trong tài liệu. (4) `zaloAccounts[].name = null` và chặn khi name != null, đúng Hỏi-1 = A. Hai chỗ tài liệu hơi lược mà không sai: lượt dừng "sau tráo" có thông báo "(sau tráo)" riêng, và việc stderr được ghi vào cloud-sync.log do cloud-sync.sh quyết định, nằm ngoài các tệp được giao.
- operational-feasibility: PASS — Mục runtime-map khớp code ở cả bốn điểm. (1) `sync-cloud.mjs` và `push-ops-facts.mjs` đều import `guardValues` từ `tier-a-guard.mjs`. (2) `factsChan` in đúng `FACTS CHẶN [tầng A] <đường> <S0x>`, dòng "không có danh sách tên" giống nguyên văn, thoát mã 1, và `--kho` đúng như tài liệu tả. (3) `piiColumnLeaks` chạy trong `gatePii` trước khi đọc local và trong `leakGate` sau khi tráo, với đúng hai thông điệp `cột ngoài danh sách cho phép` và `bảng tầng A có dòng`, cùng `--kiem-cot` trả mã 1. (4) Tên tài khoản thu: `zaloAccounts[i].name = null` và bộ soát chặn nếu `name` còn giá trị, khớp "Hỏi-1 = A" mà tài liệu và comment code đều ghi.
- spec-alignment: PASS — Mục runtime-map (dòng 112–139) khớp code ở cả bốn điểm. Cả hai đường lên cloud gọi guardValues của tier-a-guard.mjs: sync-cloud qua scanSourceNames, push-ops-facts qua factsChan. Chuỗi FACTS CHẶN, ngoại lệ zaloGroups[i].name, dòng "không có danh sách tên", `--kho`, `piiColumnLeaks`, CLOUD_ALLOW cho ba bảng, TIER_A_TABLES, chạy trước khi gửi và sau tráo, `SYNC FAIL [gate]`, `--kiem-cot` mã 1, và `zaloAccounts[i].name = null` kèm dòng chặn đều đúng như tài liệu mô tả.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-24T09:10:39Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-24T09:10:39Z

- cmd: cd app && npm test
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-24T09:10:39Z

- cmd: cd pipeline && npm test
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-24T09:10:39Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-24T09:10:39Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-soat-tang-a-moi-duong-len-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-24T09:10:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi, round 1).

Eval không phân biệt (xanh cả trên code cũ lẫn HEAD, chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `cd pipeline && npm test` phủ E1, E2, E3, E4, E5, E6, E10
- `cd pipeline && node scripts/check-cloud-sync.mjs allow` phủ E6b
- `cd app && npm test` phủ E9

Baseline khong do: round này không đo lại, trường baseline của từng eval ghi n-a.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có pass_rate hỗn hợp)

## Iterations

Round 1: PENDING-JUDGMENT — 2 finding trong hợp đồng (ca pii-cot qua bên ghi, AC-7) → sửa ở commit 28d7b78; còn mục judgment E8 chờ người.
Round 2: E6b, E7 và sáu lệnh suite chạy lại, đều xanh; E1–E6, E9, E10 carry-forward từ round 1 (delta không chạm paths của eval). Verdict PENDING-JUDGMENT: E8 chờ người chốt ở Cổng 2.
