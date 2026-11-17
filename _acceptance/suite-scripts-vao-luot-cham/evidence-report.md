---
schema_version: 2
feature_slug: suite-scripts-vao-luot-cham
verdict: REJECT
failed_evals: [E5, E7]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3199ee35d85ed059be01b807f3d972b85b7b8129
human_signoff:
---

# Evidence Report: suite-scripts-vao-luot-cham

Round 1. Hai eval không đạt: E5 (lệnh trọn bộ scripts trên cây đang chấm có 1 ca đỏ) và E7 (`node --test scripts/*.test.mjs` có ca đỏ). Năm eval còn lại (E1, E2, E3, E4, E6) xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-suite-scripts-vao-luot-cham-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sstl_buoc_ci
  verified_at: 2026-11-17T07:06:39Z
  output: |
    node --test --test-name-pattern=SSL-AC-1 scripts/suite-neu-doi.test.mjs
    duration_ms 27755.538792

- eval: E2
  run_id: minted-suite-scripts-vao-luot-cham-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sstl_tom_tat
  verified_at: 2026-11-17T07:06:39Z
  output: |
    node --test --test-name-pattern=SSL-AC-2 scripts/suite-neu-doi.test.mjs
    duration_ms 85778.370084

- eval: E3
  run_id: minted-suite-scripts-vao-luot-cham-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_471
  verified_at: 2026-11-17T07:06:39Z
  output: |
    tai-hien: xanh — #471 (5b02c3de0) đỏ đúng «(5) bước thu lỗi» ở scripts/s05-khoa-nap.test.mjs

- eval: E4
  run_id: minted-suite-scripts-vao-luot-cham-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_472
  verified_at: 2026-11-17T07:06:39Z
  output: |
    tai-hien: xanh — #472 (f3fecd5f6) đỏ đúng «DT-AC-7» ở scripts/db-thu.test.mjs

- eval: E5
  run_id: minted-suite-scripts-vao-luot-cham-E5-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.sstl_main_xanh
  verified_at: 2026-11-17T07:06:39Z
  output: |
    tests 524, pass 516, fail 1, skipped 7
    ca đỏ: scripts/job-step-thoi-luong.test.mjs:510 — JST-AC-8 bước truoc-lan-claude: «lượt không cấy ngủ phải ≤ 1 giây» (đo được 2604 ms)
    suite-neu-doi: bước «test» thoát 1
    dòng tóm tắt: {"kind":"scripts-ci","sha":"3199ee35d85ed059be01b807f3d972b85b7b8129","exit":1,"tests":524,"pass":516,"fail":1,"giay":267.9}
    kỳ vọng AC-5 là "fail":0 — không đạt.

- eval: E6
  run_id: minted-suite-scripts-vao-luot-cham-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sstl_cau_hinh
  verified_at: 2026-11-17T07:06:39Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; tám lệnh cũ (bảy suite bọc + pipeline) nguyên byte (gốc 5508f6209d5abe3ee654ca0738745155d7bfc3e6)

- eval: E7
  run_id: minted-suite-scripts-vao-luot-cham-E7-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-17T07:06:39Z
  output: |
    node --test scripts/*.test.mjs kết thúc đỏ.
    ca đỏ thấy ở đuôi: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:33 — strictEqual, actual 143, expected 0.
    kỳ vọng AC-7 là lệnh thoát 0 — không đạt.

### Lệnh fail không gắn eval

Không có lệnh nào fail mà không gắn eval. Hai lệnh fail đều gắn eval:
- `node scripts/suite-neu-doi.mjs --chay-scripts` gắn E5.
- `node --test scripts/*.test.mjs` gắn E7.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-17T07:06:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- E1 (`node --test --test-name-pattern=SSL-AC-1 scripts/suite-neu-doi.test.mjs`): xanh cả hai phía, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.
- E2 (`node --test --test-name-pattern=SSL-AC-2 scripts/suite-neu-doi.test.mjs`): xanh cả hai phía, cùng yêu cầu như E1.
- E6 (`node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs && bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`): xanh cả hai phía, hợp lý là regression-guard của cấu hình cũ.

Baseline không đo:
- bash _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh 471: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh 472: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi

Ghi chú về hai eval đỏ: E5 và E7 đều red trên baseline và đều đỏ trên HEAD. Ca đỏ của E5 là đo thời gian (JST-AC-8, 2604 ms so với trần 1 giây) và ca đỏ ở đuôi E7 là một test khác (kiem-tin-rao-gan-khu-vuc); cả hai nằm ngoài tệp mà feature này sửa. Máy không phân xử nguyên nhân; người quyết ở Cổng 2.

## Variance

none — mọi eval chạy một lượt, kết quả tất định, không có pass_rate lẫn.

## Iterations

Round 1: E5, E7 failed — `node scripts/suite-neu-doi.mjs --chay-scripts` có 1 ca đỏ (JST-AC-8, ngưỡng thời gian 1 giây bị vượt) và `node --test scripts/*.test.mjs` có ca đỏ ở kiem-tin-rao-gan-khu-vuc. Returned to implementation.
