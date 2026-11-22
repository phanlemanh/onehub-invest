---
schema_version: 2
feature_slug: hai-ca-app-dung-tren-du-lieu-may
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 63bfbb922bedbeda18811fd065022f31d44736bd
human_signoff:
---

# Evidence Report: hai-ca-app-dung-tren-du-lieu-may

Round 1. Bốn eval của hợp đồng đều đạt. Verdict tổng là REJECT vì một lệnh suite hồi quy không gắn eval nào (`pipeline_a`, ca PX1-AC-10 trong `scripts/nap-dvhc-cu.test.mjs`) đã đỏ: 432 ca qua, 1 ca đỏ. Chi tiết ở mục Lệnh suite bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht3_do3
  verified_at: 2026-11-22T07:38:38Z
  output: |
    ℹ duration_ms 42299.287542
    __EXIT=0

- eval: E2
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht3_sd6
  verified_at: 2026-11-22T07:38:38Z
  output: |
    ℹ duration_ms 82349.272875
    __EXIT=0

- eval: E3
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.ht3_ci
  verified_at: 2026-11-22T07:38:38Z
  output: |
    ℹ duration_ms 2368.448833
    __EXIT=0

- eval: E4
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ht3_pham_vi
  verified_at: 2026-11-22T07:38:38Z
  output: |
    SCOPE OK
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-22T07:38:38Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-22T07:38:38Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-22T07:38:38Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-test_a-r1
  exit_code: 1
  verified_at: 2026-11-22T07:38:38Z
  output: |
    ℹ pass 432
    ℹ fail 1
    test at scripts/nap-dvhc-cu.test.mjs:81:1
    PX1-AC-10 gán S06, S03 bằng code mới = area_id đang lưu: lệch 1905
    (mẫu: S03 offer_289d9fa0b33c1164 lưu vn-hcmc-long-binh, mới vn-hcmc; offer_ca773f5eb9c3559a lưu vn-hanoi-gia-lam, mới vn-hanoi)

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-22T07:38:38Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-22T07:38:38Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-hai-ca-app-dung-tren-du-lieu-may-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-22T07:38:38Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline): E4 (kiểm phạm vi bằng danh sách tệp đổi; là rào chắn phạm vi có chủ ý, đúng bản chất một regression-guard, không đo hành vi mới).

Lệnh suite không gắn eval nào đã đỏ: `pipeline_a` (ca PX1-AC-10, mô tả ở trên). Ca này nằm ngoài tệp mà nhánh đổi (nhánh chỉ đổi hai tệp test app); cần người xác định đây là lỗi dữ liệu máy có sẵn từ trước hay do nhánh, và baseline của lệnh này không được đo (n-a).

## Variance

none — every multi-run eval is uniform

## Judge

Không có panel judge nào được đề xuất: bốn eval đều là test hoặc script xác định, không có judgment item; không có mục nào cần human_override.

## Iterations

Round 1: không eval nào của hợp đồng đỏ (E1 đến E4 đạt), nhưng suite hồi quy `pipeline_a` có một ca đỏ (PX1-AC-10, 1905 dòng lệch mã vùng). Verdict REJECT; chờ người xác định nguồn gốc lệch rồi chạy lại.
