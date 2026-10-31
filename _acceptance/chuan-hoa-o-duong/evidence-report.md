---
schema_version: 2
feature_slug: chuan-hoa-o-duong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 17b57b7cc3cfe57cf8ebf1335c0a48671fce6346
human_signoff:
---

# Evidence Report: chuan-hoa-o-duong

Vòng 1. Cả 12 eval của hợp đồng đều xanh. Verdict là REJECT vì một lệnh suite hồi quy (`cd app && npm test`) đỏ và không gắn với eval nào (xem mục Lệnh suite bên dưới).

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
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-chuan-hoa-o-duong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-1 tiền tố vị trí xanh (20 ô)
    ℹ duration_ms 896.239541

- eval: E2
  run_id: minted-chuan-hoa-o-duong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-2 số nhà và đuôi địa chỉ xanh (8 ô)
    ℹ duration_ms 896.239541

- eval: E3
  run_id: minted-chuan-hoa-o-duong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-3 tên đường bắt đầu bằng số xanh (8 ô)
    ℹ duration_ms 896.239541

- eval: E4
  run_id: minted-chuan-hoa-o-duong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-4 ô đường không mang tên xanh (8 ô)
    ℹ duration_ms 896.239541

- eval: E5
  run_id: minted-chuan-hoa-o-duong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-5 khác đường vẫn loại xanh (6 ô)
    ℹ duration_ms 896.239541

- eval: E6
  run_id: minted-chuan-hoa-o-duong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-6 chữ Eth xanh
    ℹ duration_ms 896.239541

- eval: E7
  run_id: minted-chuan-hoa-o-duong-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-7 thẻ và luật cùng khoá đường xanh (58 ô)
    ℹ duration_ms 896.239541

- eval: E8
  run_id: minted-chuan-hoa-o-duong-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-entity-duong.test.ts: ca CD-AC-8 probe ô đường thật xanh
    ℹ duration_ms 896.239541

- eval: E9
  run_id: minted-chuan-hoa-o-duong-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T09:37:09Z
  output: |
    agent/tests/judge-luat.test.ts: mọi ca xanh
    ℹ duration_ms 875.64825

- eval: E10
  run_id: minted-chuan-hoa-o-duong-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-31T09:37:09Z
  output: |
    app/tests/the-duyet-phuong-lech-gia.test.tsx: mọi ca xanh
    ℹ duration_ms 2344.063209

- eval: E11
  run_id: minted-chuan-hoa-o-duong-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-31T09:37:09Z
  output: |
    app/tests/the-duyet-du-can-cu.test.tsx: mọi ca xanh
    ℹ duration_ms 4723.367833

- eval: E12
  run_id: minted-chuan-hoa-o-duong-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.the_so_song
  verified_at: 2026-10-31T09:37:09Z
  output: |
    app/tests/the-so-gia-tri-song.test.tsx: mọi ca xanh
    ℹ duration_ms 2869.919416

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuan-hoa-o-duong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T09:37:09Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chuan-hoa-o-duong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T09:37:09Z

- cmd: cd app && npm test
  run_id: minted-chuan-hoa-o-duong-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-31T09:37:09Z
  ghi chú: một ca đỏ, `tests/ops-nhan-theo-context.test.tsx` ca «ON12-AC-7 mọi giá trị đang có trên DB local có nhãn». Trang /ops còn chữ thô theo luật du-phong «(chưa có tên Việt)» trong hai chuỗi «S06 · da-nang (chưa có tên Việt)» và «da-nang (chưa có tên Việt)». Ca này đo dữ liệu thật trên DB local (giá trị da-nang chưa có nhãn), không gắn eval nào của hợp đồng này; chưa xác định là hồi quy do diff hay do dữ liệu máy.

- cmd: cd pipeline && npm test
  run_id: minted-chuan-hoa-o-duong-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T09:37:09Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuan-hoa-o-duong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T09:37:09Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuan-hoa-o-duong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T09:37:09Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): E9, E10, E11, E12. Đây là regression-guard có chủ ý của AC-9 (tệp test không đổi so với main), không phải bằng chứng cho hành vi mới.

Baseline không đo:
- cd agent && node --import tsx --test tests/judge-entity-duong.test.ts: bo qua baseline: tep agent/tests/judge-entity-duong.test.ts co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi

Lệnh suite `cd app && npm test` có một ca đỏ (mô tả ở mục Lệnh suite) và không gắn eval nào, nên `failed_evals` để trống nhưng verdict là REJECT.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval E1–E12 xanh; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-7 (nhãn «chưa có tên Việt» cho da-nang trên DB local), không gắn eval. Trả về triển khai/điều tra: xác định ca đỏ có sẵn ở main hay do diff.

