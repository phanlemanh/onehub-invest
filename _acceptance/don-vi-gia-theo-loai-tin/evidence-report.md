---
schema_version: 2
feature_slug: don-vi-gia-theo-loai-tin
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: aaa16555ffd6685eb4ffa12f696709ba5f545008
human_signoff:
---

# Evidence Report: don-vi-gia-theo-loai-tin

Verdict REJECT vì lệnh suite `cd pipeline && npm test` đỏ (không gắn eval nào). Cả sáu eval của hợp đồng (E1-E6) đều xanh.

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
  run_id: minted-don-vi-gia-theo-loai-tin-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dvg_app
  verified_at: 2026-11-06T11:19:03Z
  output: |
    ba ca DVG chạy, khớp 'pass 3'
    ℹ duration_ms 15907.163084

- eval: E2
  run_id: minted-don-vi-gia-theo-loai-tin-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dvg_app
  verified_at: 2026-11-06T11:19:03Z
  output: |
    cùng lệnh với E1 (ba ca DVG-AC, 'pass 3')
    ℹ duration_ms 15907.163084

- eval: E3
  run_id: minted-don-vi-gia-theo-loai-tin-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dvg_app
  verified_at: 2026-11-06T11:19:03Z
  output: |
    cùng lệnh với E1 (ba ca DVG-AC, 'pass 3')
    ℹ duration_ms 15907.163084

- eval: E4
  run_id: minted-don-vi-gia-theo-loai-tin-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T11:19:03Z
  output: |
    ℹ duration_ms 28906.742375

- eval: E5
  run_id: minted-don-vi-gia-theo-loai-tin-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-11-06T11:19:03Z
  output: |
    ℹ duration_ms 14240.8295

- eval: E6
  run_id: minted-don-vi-gia-theo-loai-tin-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dvg_pham_vi
  verified_at: 2026-11-06T11:19:03Z
  output: |
    PHAM-VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-06T11:19:03Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-06T11:19:03Z

- cmd: cd app && npm test
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-06T11:19:03Z

- cmd: cd pipeline && npm test
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-06T11:19:03Z
  note: 601 ca, 600 đạt, 1 hỏng, không gắn eval nào. Ca hỏng là scripts/vocab-lint.test.mjs:167 «VL-AC-5 ma trận kiểm kê: sáu tệp đọc hằng sinh, tập ngoại lệ đúng bản ghim». Lỗi: «cây thật còn chỗ viết tay ngoài sổ», chỉ ra app/src/components/ops/labels/gia-la.ts:5 · kind · rent_lt,sale (tệp mới của lát này viết tay hằng kind, chưa có trong sổ ngoại lệ).

- cmd: cd app && npm run test:lint-rules
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-06T11:19:03Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-don-vi-gia-theo-loai-tin-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-06T11:19:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không phân biệt (pass trên cả HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- E4: `cd app && node --import tsx --test tests/labels-nhom.test.tsx`
- E5: `cd app && node --import tsx --test tests/ops-nhan-theo-context.test.tsx`

Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

Không có panel judge nào trong round này (không có eval judgment).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval nào đỏ; lệnh suite `cd pipeline && npm test` đỏ ở ca VL-AC-5 (gia-la.ts:5 viết tay hằng kind ngoài sổ ngoại lệ). Trả về bước triển khai.
