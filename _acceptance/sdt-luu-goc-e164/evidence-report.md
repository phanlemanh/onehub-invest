---
schema_version: 2
feature_slug: sdt-luu-goc-e164
verdict: REJECT
failed_evals: ["E2","E3","E6","E7","E8"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4aac79a4518f3f9f2c4c3ac91f15ae96dd4ec42b
human_signoff:
---

# Evidence Report: sdt-luu-goc-e164

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | REJECT |
| E3 | AC-3 | script | REJECT |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | REJECT |
| E7 | AC-7 | script | REJECT |
| E8 | AC-8 | script | REJECT |
| E9 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-luu-goc-e164-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sd3_boc
  verified_at: 2026-10-31T09:49:23Z
  output: |
    ℹ duration_ms 219.830583

- eval: E2
  run_id: minted-sdt-luu-goc-e164-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.sd3_mig
  verified_at: 2026-10-31T09:49:23Z
  output: |
    error: relation "registry_aliases" does not exist
        at async Object.mig (probes/do.mjs:92:5)
    code: '42P01' (bảng registry_aliases chưa có trong DB thử được dựng)

- eval: E3
  run_id: minted-sdt-luu-goc-e164-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.sd3_du_lieu
  verified_at: 2026-10-31T09:49:23Z
  output: |
    error: relation "sale_offer_records" does not exist
        at async anhXa (probes/do.mjs:67:20)
    code: '42P01' (bảng sale_offer_records chưa có trong DB thử được dựng)

- eval: E4
  run_id: minted-sdt-luu-goc-e164-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_danh_ba
  verified_at: 2026-10-31T09:49:23Z
  output: |
    DANH BA OK

- eval: E5
  run_id: minted-sdt-luu-goc-e164-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_sellers
  verified_at: 2026-10-31T09:49:23Z
  output: |
    SELLERS OK

- eval: E6
  run_id: minted-sdt-luu-goc-e164-E6-r1
  exit_code: 3
  baseline: n-a
  verifier: config:executors.test.sd3_bait_gap
  verified_at: 2026-10-31T09:49:23Z
  output: |
    NOTICE:  database "oneinvest_p4_sd3_bait_gap" does not exist, skipping
    ERROR:  syntax error at or near ","
    LINE 8:     captured_at timestamp with time zone DEFAULT ,

- eval: E7
  run_id: minted-sdt-luu-goc-e164-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.sd3_cloud
  verified_at: 2026-10-31T09:49:23Z
  output: |
    error: relation "registry_aliases" does not exist
        at async Object.cloud (probes/do.mjs:316:5)
    code: '42P01'

- eval: E8
  run_id: minted-sdt-luu-goc-e164-E8-r1
  exit_code: 3
  baseline: n-a
  verifier: config:executors.script.sd3_doc
  verified_at: 2026-10-31T09:49:23Z
  output: |
    ℹ pass 3
    ℹ fail 0
    pg_dump: error: query failed: ERROR:  schema "dc_local_42606" does not exist
    ERROR:  relation "registry_aliases" does not exist

- eval: E9
  run_id: minted-sdt-luu-goc-e164-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sd3_pham_vi
  verified_at: 2026-10-31T09:49:23Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-31T09:49:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-luu-goc-e164-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-31T09:49:23Z

- cmd: cd app && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-31T09:49:23Z
  ghi chú: một ca đỏ, ON12-AC-7 (tests/ops-nhan-theo-context.test.tsx) — trang /ops còn chữ thô «(chưa có tên Việt)» trong «S06 · da-nang (chưa có tên Việt)» và «da-nang (chưa có tên Việt)». Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-sdt-luu-goc-e164-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-31T09:49:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-luu-goc-e164-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-31T09:49:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-luu-goc-e164-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-31T09:49:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (pass trên cả HEAD lẫn baseline): E1 (lệnh `node --test pipeline/parse.test.mjs pipeline/scripts/boc-sdt.test.mjs`) — cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.

Lệnh fail không gắn eval: `cd app && npm test` (một ca đỏ ON12-AC-7, xem khối suite).

Nguyên nhân các eval đỏ: E2, E3, E7, E8 dừng vì DB thử được dựng thiếu bảng (`registry_aliases`, `sale_offer_records`, schema chép máy thu `dc_local_42606` không tồn tại), E6 dừng vì câu tạo bảng có `DEFAULT` rỗng khi dựng DB thử. Cả năm đều chết ở bước dựng môi trường đo, chưa tới phép đo hành vi của 060.

Baseline không đo:
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs mig: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs du-lieu: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs danh-ba: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs sellers: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-luu-goc-e164/probes/bait-gap.sh: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/bait-gap.sh co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/sdt-luu-goc-e164/probes/do.mjs cloud: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/do.mjs co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-luu-goc-e164/probes/people.sh: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/people.sh co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/sdt-luu-goc-e164/probes/pham-vi.sh: bo qua baseline: tep _acceptance/sdt-luu-goc-e164/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base 82a53e0a84604610a26b381021b325d4c085f8bf — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2, E3, E6, E7, E8 failed — DB thử dựng thiếu bảng (registry_aliases, sale_offer_records), schema chép máy thu không tồn tại, và câu tạo bảng DEFAULT rỗng ở bait-gap.sh. Returned to implementation.
