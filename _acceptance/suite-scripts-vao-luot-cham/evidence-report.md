---
schema_version: 2
feature_slug: suite-scripts-vao-luot-cham
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4dd65afc3bc1c385ddea27bea975b95dddb41faa
human_signoff:
---

# Evidence Report: suite-scripts-vao-luot-cham

Cả bảy eval của hợp đồng đều đạt. Verdict vẫn là REJECT vì một lệnh suite hồi quy không gắn eval nào (`app_ui`, `cd app && npm test`) đỏ ở round này. Chi tiết ở mục lệnh suite bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-suite-scripts-vao-luot-cham-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_buoc_ci
  verified_at: 2026-11-17T20:20:30Z
  output: |
    co-ca: xanh — 2 ca «SSL-AC-1» chạy và đạt

- eval: E2
  run_id: minted-suite-scripts-vao-luot-cham-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tom_tat
  verified_at: 2026-11-17T20:20:30Z
  output: |
    co-ca: xanh — 3 ca «SSL-AC-2» chạy và đạt

- eval: E3
  run_id: minted-suite-scripts-vao-luot-cham-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_471
  verified_at: 2026-11-17T20:20:30Z
  output: |
    tai-hien: xanh — #471 (5b02c3de0) đỏ đúng «(5) bước thu lỗi» ở scripts/s05-khoa-nap.test.mjs

- eval: E4
  run_id: r3-l4-1-20261117202030
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_472
  verified_at: 2026-11-17T20:20:30Z
  output: |
    tai-hien: xanh — #472 (f3fecd5f6) đỏ đúng «DT-AC-7» ở scripts/db-thu.test.mjs

- eval: E5
  run_id: minted-suite-scripts-vao-luot-cham-E5-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.sstl_main_xanh
  verified_at: 2026-11-17T20:20:30Z
  output: |
    {"kind":"scripts-ci","ts":"2026-11-17T20:23:36.239Z","sha":"4dd65afc3bc1c385ddea27bea975b95dddb41faa","exit":0,"tests":525,"pass":518,"fail":0,"giay":137.6}

- eval: E6
  run_id: minted-suite-scripts-vao-luot-cham-E6-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.sstl_cau_hinh
  verified_at: 2026-11-17T20:20:30Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; tám lệnh cũ (bảy suite bọc + pipeline) nguyên byte (gốc 5508f6209d5abe3ee654ca0738745155d7bfc3e6)

- eval: E7
  run_id: minted-suite-scripts-vao-luot-cham-E7-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-17T20:20:30Z
  output: |
    node --test scripts/*.test.mjs xong, thời gian chạy khoảng 1173 giây, kết thúc thành công

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-17T20:20:30Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-17T20:20:30Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 1
  verified_at: 2026-11-17T20:20:30Z
  note: Lệnh này không gắn eval nào và đỏ. Ca đỏ là app/tests/the-so-gia-tri-song.test.tsx (so sánh deepStrictEqual danh sách số, thực tế chỉ có 13–24, kỳ vọng thêm dải 216026–216085). Đây là đầu ra của bộ test app, nằm ngoài những gì hợp đồng suite-scripts-vao-luot-cham chạm; cần người xác định đây là lỗi tồn tại sẵn của app hay do dữ liệu máy.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-17T20:20:30Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-17T20:20:30Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-17T20:20:30Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-17T20:20:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh ở cả nhánh lẫn baseline):
- E6 — regression-guard có chủ ý: khẳng định bảy key cũ và tám lệnh gốc nguyên byte, nên xanh trên code cũ là đúng.

Lệnh fail không gắn eval: `node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'` (xem mục lệnh suite).

Baseline khong do
- bash _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh SSL-AC-1: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh SSL-AC-2: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh 471: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh 472: bo qua baseline: tep _acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh co o cay dang kiem nhung chua co o merge-base 5508f6209d5abe3ee654ca0738745155d7bfc3e6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (cả bảy eval chạy một lần, tất định).

## Iterations

Round 1: E5, E7 đỏ do tải máy (commit 3a54923e9). Trả về triển khai.
Round 2: sửa --chay-scripts giữ dòng tổng kết khi lượt đỏ dài, co-ca.sh bắt ca bị skip, E7 long_running 60 (9a9af468); chạy khô xanh.
Round 3: bảy eval đều đạt; REJECT vì lệnh suite app_ui (không gắn eval) đỏ ở the-so-gia-tri-song.test.tsx.
