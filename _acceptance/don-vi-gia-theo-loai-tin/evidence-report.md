---
schema_version: 2
feature_slug: don-vi-gia-theo-loai-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ed5b7a1ee5c88ca29278f8dfee84009cf4e5124d
human_signoff: Mạnh 2026-11-06
---

# Evidence Report: don-vi-gia-theo-loai-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-don-vi-gia-theo-loai-tin-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dvg_app
  verified_at: 2026-11-06T11:35:23Z
  output: |
    Ba ca DVG chạy, 'pass 3' khớp; ca DVG-AC-1 xanh.
    duration_ms 14848.154833

- eval: E2
  run_id: minted-don-vi-gia-theo-loai-tin-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dvg_app
  verified_at: 2026-11-06T11:35:23Z
  output: |
    Ba ca DVG chạy, 'pass 3' khớp; ca DVG-AC-2 xanh.
    duration_ms 14848.154833

- eval: E3
  run_id: minted-don-vi-gia-theo-loai-tin-E3-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.dvg_app
  verified_at: 2026-11-06T11:19:03Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-don-vi-gia-theo-loai-tin-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T11:35:23Z
  output: |
    Test của lát theo nhóm xanh, gồm TND-AC-6 và THN-AC-1.
    duration_ms 27706.119708

- eval: E5
  run_id: minted-don-vi-gia-theo-loai-tin-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-11-06T11:35:23Z
  output: |
    Thước nhãn Ops xanh.
    duration_ms 12990.043917

- eval: E6
  run_id: minted-don-vi-gia-theo-loai-tin-E6-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.script.dvg_pham_vi
  verified_at: 2026-11-06T11:19:03Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-06T11:35:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-06T11:35:23Z

- cmd: cd app && npm test
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-06T11:35:23Z

- cmd: cd pipeline && npm test
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-06T11:35:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-06T11:35:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-06T11:35:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline; regression-guard có chủ ý, hoặc cần viết lại để assert hành vi mới):
- E4 (cd app && node --import tsx --test tests/labels-nhom.test.tsx)
- E5 (cd app && node --import tsx --test tests/ops-nhan-theo-context.test.tsx)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: suite pipeline đỏ ở VL-AC-5 (gia-la.ts gõ cứng chuỗi Loại tin) — REJECT, trả về implementation.
Round 2: đã sửa bằng hằng KIND của sổ từ vựng (ed5b7a1e); E1, E2, E4, E5 và sáu lệnh suite chạy lại xanh, E3 và E6 carry-forward từ round 1 — PASS.
