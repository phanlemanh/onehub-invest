---
schema_version: 2
feature_slug: do-nen-hieu-nang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 19b0fd40ec2f30bbea8746e08818dfee576d9601
human_signoff: Mạnh 2026-10-29
---

# Evidence Report: do-nen-hieu-nang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do-nen-hieu-nang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_db
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do-nen-hieu-nang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_trang
  verified_at: 2026-10-29T08:10:48Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-do-nen-hieu-nang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_tai_lieu
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-do-nen-hieu-nang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_thong_ke
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-do-nen-hieu-nang-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_khong_luat
  verified_at: 2026-10-29T08:16:29Z
  output: |
    KHONG LUAT OK

- eval: E6
  run_id: minted-do-nen-hieu-nang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_pham_vi
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-29T08:16:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-nen-hieu-nang-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-29T08:16:29Z

- cmd: cd app && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-29T08:16:29Z

- cmd: cd pipeline && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-29T08:16:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-nen-hieu-nang-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-29T08:16:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-nen-hieu-nang-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-29T08:16:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — không eval nào bị xác định là không-phân-biệt (baseline bị chặn hạ tầng nên không đo được ở round này; mọi field baseline là n-a).

### Baseline khong do

- node _acceptance/do-nen-hieu-nang/probes/khong-luat.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Ghi chú: mốc verified_at của các lệnh chạy ở round 3 (E5 và sáu lệnh suite) là mốc làm tròn do người soạn không đọc được đồng hồ máy; thời điểm chính xác nằm ở dòng `ts` tương ứng trong run-log.jsonl.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bằng chứng gốc cho E1, E3, E4, E6 (E5 chạy trên bản sau khi che tên nguồn bằng source_registry sống, commit 7ec916ce).
Round 2: E5 đỏ — s4-args.json được commit mang 6 đường tệp có tên nguồn thật; E2 chạy lại ở round này. Returned to implementation.
Round 3: E5 xanh sau commit 19b0fd40 (bỏ theo dõi tệp args S4 khỏi nhánh); E1, E2, E3, E4, E6 carry-forward; sáu lệnh suite xanh. Verdict PASS.
