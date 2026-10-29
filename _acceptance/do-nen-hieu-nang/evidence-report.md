---
schema_version: 2
feature_slug: do-nen-hieu-nang
verdict: REJECT
failed_evals: ["E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7ec916ce413ba1f2fff51f899733bd706872ff49
human_signoff:
---

# Evidence Report: do-nen-hieu-nang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward từ round 1) |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS (carry-forward từ round 1) |
| E4 | AC-4 | script | PASS (carry-forward từ round 1) |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | PASS (carry-forward từ round 1) |

Lệnh fail không gắn eval: không có. Lệnh fail duy nhất là `node _acceptance/do-nen-hieu-nang/probes/khong-luat.mjs`, thuộc eval E5.

## Evidence

- eval: E1
  run_id: minted-do-nen-hieu-nang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_db
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do-nen-hieu-nang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_trang
  verified_at: 2026-10-29T08:10:48Z
  output: |
    TRANG OK

- eval: E3
  run_id: minted-do-nen-hieu-nang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_tai_lieu
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-do-nen-hieu-nang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_thong_ke
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-do-nen-hieu-nang-E5-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.dn_khong_luat
  verified_at: 2026-10-29T08:10:48Z
  output: |
    root /Users/manhphan/dev/onehub-invest/.claude/worktrees/brave-northcutt-955c6a sha 7ec916ce413ba1f2fff51f899733bd706872ff49
    ok muc De xuat nguong: tach rieng, ghi cho Manh quyet
    ok AGENTS.md khong doi
    LO TEN NGUON: _acceptance/do-nen-hieu-nang/s4-args.json (6 cho)
    doi chung: ban chep scripts/do-nen-hieu-nang/do.mjs chen ten that → bat, neu tep
    doi chung song: ban chep scripts/do-nen-hieu-nang/do.mjs chen ten chi co o source_registry (S08) → bat
    doi chung rong: dong doi giu ten cu → 0, chen them mot ten → bat
  # Không có dòng «KHONG LUAT OK». Tệp s4-args.json (commit 7ec916ce) là artefact của kit liệt kê đường dẫn tệp test, 6 đường dẫn chứa tên nguồn thật; đầu dò quét mọi tệp nhánh đổi nên đỏ.

- eval: E6
  run_id: minted-do-nen-hieu-nang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn_pham_vi
  verified_at: 2026-10-29T08:03:02Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-29T08:10:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-nen-hieu-nang-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-29T08:10:48Z

- cmd: cd app && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-29T08:10:48Z

- cmd: cd pipeline && npm test
  run_id: minted-do-nen-hieu-nang-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-29T08:10:48Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-nen-hieu-nang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-29T08:10:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-nen-hieu-nang-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-29T08:10:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt không đo được ở round này vì baseline bị chặn hạ tầng; mọi field baseline ghi n-a.

Baseline khong do:

- bash _acceptance/do-nen-hieu-nang/probes/trang.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/do-nen-hieu-nang/probes/khong-luat.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval không-phân-biệt: none (không đo được vì baseline bị chặn hạ tầng, xem trên).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E6 và sáu lệnh suite đều xanh tại cb8efcf3; baseline bị chặn hạ tầng nên không đo được phân biệt. Verdict PASS.
Round 2: E5 đỏ tại 7ec916ce — commit s4-args.json (artefact kit liệt kê đường dẫn tệp test, 6 đường dẫn chứa tên nguồn thật) làm đầu dò tầng A báo «LO TEN NGUON»; E2 chạy lại xanh, E1/E3/E4/E6 carry-forward từ round 1, sáu lệnh suite xanh. Returned to implementation.
