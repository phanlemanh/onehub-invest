---
schema_version: 2
feature_slug: do-san-sl1-kdm
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: cc1ebad5d59c116594ddd47c77a19d8a2a089d30
human_signoff:
---

# Evidence Report: do-san-sl1-kdm

Round 4. Bốn eval của hợp đồng (E1–E4) đều xanh, chuyển từ các round trước vì delta không chạm paths của chúng. Verdict REJECT vì một lệnh suite hồi quy không gắn eval nào đỏ: `cd app && npm test` có một ca đỏ, ON12-AC-7 (xem mục suite bên dưới). Lệnh này không thuộc eval nào nên `failed_evals` để trống.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-do-san-sl1-kdm-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_doc
  verified_at: 2026-11-10T23:16:17Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do-san-sl1-kdm-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_vi_tu
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-do-san-sl1-kdm-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-do-san-sl1-kdm-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_khong_db_chung
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-11T05:33:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-san-sl1-kdm-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-11T05:33:25Z

- cmd: cd app && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bd9a35-r4
  exit_code: 1
  verified_at: 2026-11-11T05:33:25Z
  output: |
    tests 1115, pass 1109, fail 1, skipped 5.
    Ca đỏ duy nhất: ON12-AC-7 "mọi giá trị đang có trên DB local có nhãn" (app/tests/ops-nhan-theo-context.test.tsx).
    Kỳ vọng danh sách rỗng, thực tế ['draft']: DB local có giá trị 'draft' chưa có nhãn.
    Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-11T05:33:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-san-sl1-kdm-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-11T05:33:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-san-sl1-kdm-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-11T05:33:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — hồ sơ vòng 1, hợp đồng và evals theo nhát sửa. Returned to implementation.
Round 2: REJECT chỉ vì E5 (AU11-AC-3 chập chờn khi tải, main cũng đỏ). Mạnh thu AC-5 thành Known limits, ký lại Cổng Phạm vi.
Round 3: BLOCKED hạ tầng (pipeline quá 30 phút, app hai ca chập chờn); E1–E4 xanh.
Round 4: REJECT — E1–E4 xanh (carry-forward), nhưng lệnh suite `cd app && npm test` có một ca đỏ ON12-AC-7 (nhãn thiếu cho giá trị 'draft' trên DB local), không gắn eval nào. Cần người xem ca này có liên quan đến feature hay là trạng thái DB local.
